'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  getAllFlowers,
  createFlower,
  updateFlower,
  deleteFlower,
  setFlowerArchived,
  setFlowerStock,
  deleteFlowerImage,
  getStorageInfo,
  validateImageFiles,
  bulkUpdateFlowers,
  BORRAR_VASE_LIFE_DAYS,
  type EtapaSubida,
} from '@/lib/flowers';
import { compressImage } from '@/lib/image-compress';
import Image from 'next/image';
import { APERTURAS, COUNTRIES, ROSE_TIERS, countryLabels, type CountryCode, type Flower } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import PricingPanel from '../PricingPanel';
import ConfirmDialog from '../precios/ConfirmDialog';
import Mas from '../precios/Mas';
import toast from 'react-hot-toast';

type Tab = 'catalog' | 'pricing' | 'inquiries';
type Mode = 'list' | 'create' | 'edit';

/** Los 7 primeros caracteres del commit desplegado. Vercel expone la variable
 *  sola cuando el proyecto tiene activadas las variables de sistema. */
const VERSION = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7);

/** Una escritura de Firestore o una subida a Storage no tienen límite de tiempo
 *  propio: si la conexión se degrada, la promesa queda pendiente para siempre y
 *  el botón gira sin fin. Este tope la convierte en un error visible. */
const SAVE_TIMEOUT_MS = 60_000;

function conTiempoLimite<T>(promesa: Promise<T>, ms = SAVE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ]);
}

/** Traduce el fallo a algo accionable en vez de "Error al guardar la flor". */
function mensajeDeError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const msg = (err as { message?: string })?.message ?? '';

  if (msg === 'TIMEOUT') {
    return 'El servidor tardó demasiado. Puede que sí se haya guardado: revisá la lista de flores antes de volver a intentar, para no crearla dos veces.';
  }
  if (msg === 'STORAGE_LIMIT_REACHED') {
    return 'El almacenamiento está lleno. Elimina imágenes antes de subir nuevas.';
  }
  if (code.includes('unauthorized') || code.includes('permission-denied')) {
    return 'El servidor rechazó el guardado. Si la foto no es JPG, PNG, WebP o GIF, conviértela y volvé a intentar.';
  }
  if (code.includes('unauthenticated')) {
    return 'Tu sesión expiró. Recargá la página e iniciá sesión de nuevo.';
  }
  return `No se pudo guardar. Revisá tu conexión y volvé a intentar. Si vuelve a pasar, avísale a Francisco y mándale una captura de pantalla${code ? ` (código: ${code})` : ''}.`;
}

const emptyForm = {
  name: '',
  description: '',
  inStock: true,
  archived: false,
  category: '',
  tier: '',
  apertura: '',
  stemLength: '',
  headSize: '',
  vaseLifeDays: '',
  colors: [] as string[],
  availableIn: [] as CountryCode[],
};

export default function AdminDashboard() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('catalog');
  // Precios se monta la primera vez que se abre y DESPUÉS se queda montado
  // (oculto) al cambiar de pestaña. Antes se desmontaba y se perdía, sin aviso,
  // todo lo escrito en una hoja que aún no se había guardado.
  const [preciosAbierto, setPreciosAbierto] = useState(false);
  const [mode, setMode] = useState<Mode>('list');
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [editingFlower, setEditingFlower] = useState<Flower | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // Eliminar una flor es para siempre: se confirma en un diálogo que dice cuál.
  const [porEliminar, setPorEliminar] = useState<Flower | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  // Las fotos que se quitan de una flor existente se borran recién al guardar:
  // si se cancela, vuelven. Antes se borraban al instante.
  const [quitadasImg, setQuitadasImg] = useState<string[]>([]);
  // Foto del formulario al abrirlo, para saber si hay algo sin guardar.
  const [baseForm, setBaseForm] = useState('');
  const [salida, setSalida] = useState<(() => void) | null>(null);
  const [cargandoFlores, setCargandoFlores] = useState(true);
  const [errorFlores, setErrorFlores] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageInfo, setStorageInfo] = useState<{ usedBytes: number; limitBytes: number; nearLimit: boolean } | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [aplicandoLote, setAplicandoLote] = useState(false);
  const [paso, setPaso] = useState('');

  useEffect(() => {
    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace('/admin');
      setAuthLoading(false);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!authLoading) loadFlowers();
  }, [authLoading]);

  const loadFlowers = async () => {
    try {
      const [data, info] = await Promise.all([getAllFlowers(), getStorageInfo()]);
      setFlowers(data);
      setStorageInfo(info);
      setErrorFlores(false);
    } catch {
      setErrorFlores(true);
      toast.error('No se pudieron cargar las flores. Revisá tu conexión y probá de nuevo.', { duration: 6000 });
    } finally {
      setCargandoFlores(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuthInstance());
    } finally {
      router.replace('/admin');
    }
  };

  const openCreate = () => {
    setEditingFlower(null);
    setForm({ ...emptyForm });
    setBaseForm(JSON.stringify({ form: emptyForm, imgs: [] }));
    setQuitadasImg([]);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setMode('create');
  };

  const openEdit = (flower: Flower) => {
    setEditingFlower(flower);
    const formInicial = {
      name: flower.name,
      description: flower.description,
      inStock: flower.inStock,
      archived: flower.archived,
      category: flower.category || '',
      tier: flower.tier || '',
      apertura: flower.apertura || '',
      stemLength: flower.stemLength || '',
      headSize: flower.headSize || '',
      vaseLifeDays: flower.vaseLifeDays?.toString() || '',
      colors: flower.colors || [],
      availableIn: flower.availableIn || [],
    };
    setForm(formInicial);
    setBaseForm(JSON.stringify({ form: formInicial, imgs: flower.images }));
    setQuitadasImg([]);
    setExistingImages([...flower.images]);
    setImageFiles([]);
    setImagePreviews([]);
    setMode('edit');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Se reduce y recodifica en el navegador antes de que llegue a Storage.
    // Con foto de celular esto puede tardar, así que se avisa: antes parecía
    // que la pantalla se había colgado.
    setPaso('Preparando la foto…');
    let compressed: File[];
    try {
      // De a una, no `Promise.all`: varias fotos de celular a la vez multiplican
      // la memoria y el trabajo del navegador justo cuando menos aguanta.
      compressed = [];
      for (const [i, f] of files.entries()) {
        setPaso(files.length > 1 ? `Preparando foto ${i + 1} de ${files.length}…` : 'Preparando la foto…');
        compressed.push(await conTiempoLimite(compressImage(f), 30_000));
      }
    } catch (err) {
      console.error('[admin] falló la preparación de la foto:', err);
      toast.error(
        'No se pudo preparar la foto. Si viene del iPhone, exportala como JPG y volvé a intentar.',
        { duration: 8000 }
      );
      e.target.value = '';
      setPaso('');
      return;
    }
    setPaso('');

    const error = validateImageFiles(compressed);
    if (error) {
      toast.error(error, { duration: 8000 });
      e.target.value = '';
      return;
    }

    setImageFiles((prev) => [...prev, ...compressed]);
    const newPreviews = compressed.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addColor = () => setForm((p) => ({ ...p, colors: [...p.colors, '#7B7369'] }));
  const updateColor = (idx: number, value: string) =>
    setForm((p) => ({ ...p, colors: p.colors.map((c, i) => (i === idx ? value : c)) }));
  const removeColor = (idx: number) =>
    setForm((p) => ({ ...p, colors: p.colors.filter((_, i) => i !== idx) }));

  // Quitar una foto de una flor que ya existe solo la saca del formulario; el
  // archivo se borra al guardar (ver handleSave). Cancelar la devuelve.
  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setQuitadasImg((prev) => [...prev, url]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('El nombre es requerido'); return; }
    if (!form.category) { toast.error('Selecciona una categoría'); return; }
    if (storageInfo?.nearLimit && imageFiles.length > 0) {
      toast.error('El almacenamiento está lleno. Elimina imágenes antes de subir nuevas.', { duration: 6000 });
      return;
    }
    setSaving(true);
    try {
      // Con foto, el guardado pasa por cuatro etapas y cualquiera puede
      // trabarse. Mostrarlas convierte "se quedó cargando" en un dato.
      const avisar = (etapa: EtapaSubida, pct?: number) =>
        setPaso(
          etapa === 'cuota'
            ? 'Revisando espacio…'
            : etapa === 'subiendo'
              ? `Subiendo foto ${pct ?? 0}%`
              : etapa === 'url'
                ? 'Obteniendo enlace…'
                : 'Actualizando contador…'
        );

      if (mode === 'create') {
        // Firestore rechaza `undefined` explícito, y en creación se puede
        // simplemente omitir el atributo: un documento nuevo no trae la
        // clave si el campo quedó vacío, no hay valor viejo que proteger.
        const attributes = {
          ...(form.tier && { tier: form.tier as Flower['tier'] }),
          ...(form.apertura && { apertura: form.apertura as Flower['apertura'] }),
          ...(form.stemLength && { stemLength: form.stemLength }),
          ...(form.headSize && { headSize: form.headSize }),
          ...(form.vaseLifeDays && { vaseLifeDays: Number(form.vaseLifeDays) }),
          ...(form.colors.length > 0 && { colors: form.colors }),
          availableIn: form.availableIn,
        };
        await conTiempoLimite(
          createFlower(
            { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: [], ...attributes },
            imageFiles,
            avisar
          )
        );
        toast.success('Flor creada exitosamente');
      } else if (editingFlower) {
        // BUG DE FONDO (encontrado el 2026-09-28, ver AGENTS copy/memory/Leo.md):
        // en edición, omitir un atributo cuando el campo queda vacío NO lo
        // borra. `updateDoc` hace merge, así que el valor viejo se queda
        // pegado para siempre por más veces que se guarde. Así terminaron 8
        // flores con "Tamaño de cabeza: -" imposible de limpiar desde la
        // interfaz: cada intento de vaciar el campo y guardar dejaba el "-"
        // intacto. Acá SIEMPRE se manda el valor actual, incluso vacío.
        const attributes = {
          // Texto libre: el resto del código ya los trata como ausentes
          // cuando son '' (`flower.tier && ...`, etc.), mandarlos vacíos
          // alcanza para borrarlos de verdad.
          tier: form.tier || '',
          apertura: form.apertura || '',
          stemLength: form.stemLength || '',
          headSize: form.headSize || '',
          // vaseLifeDays no puede vaciarse con '' ni con 0: 0 es un valor
          // válido (`!= null` en FlowerDetailClient lo mostraría como
          // "0 días"). Hace falta borrar la clave de verdad.
          vaseLifeDays: form.vaseLifeDays ? Number(form.vaseLifeDays) : BORRAR_VASE_LIFE_DAYS,
          colors: form.colors,
          availableIn: form.availableIn,
        };
        await conTiempoLimite(
          updateFlower(
            editingFlower.id,
            { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: existingImages, ...attributes },
            imageFiles,
            avisar
          )
        );
        // La flor ya quedó sin esas fotos: ahora sí se borran los archivos.
        for (const url of quitadasImg) await deleteFlowerImage(url);
        toast.success('Flor actualizada');
      }
      await loadFlowers();
      setMode('list');
    } catch (err) {
      // Sin este log, cualquier fallo (reglas, Storage, red) se veía igual y no
      // había forma de diagnosticarlo desde el navegador.
      console.error('[admin] falló el guardado de la flor:', err);
      toast.error(mensajeDeError(err), { duration: 8000 });
    } finally {
      setSaving(false);
      setPaso('');
    }
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await deleteFlower(porEliminar.id, porEliminar.images);
      await loadFlowers();
      toast.success('Flor eliminada');
      setPorEliminar(null);
    } catch {
      setErrorEliminar('No se pudo eliminar la flor. Revisá tu conexión y probá de nuevo.');
    } finally {
      setEliminando(false);
    }
  };

  const formSucio = (mode === 'create' || mode === 'edit') && (JSON.stringify({ form, imgs: existingImages }) !== baseForm || imageFiles.length > 0);

  // Salir del formulario de flor (otra pestaña, Volver, Cancelar) con cambios sin
  // guardar pregunta antes: antes se tiraba todo, fotos incluidas, sin aviso.
  const salirDeFlor = (accion: () => void) => {
    if (formSucio) setSalida(() => accion);
    else accion();
  };

  useEffect(() => {
    if (!formSucio) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [formSucio]);

  // Parche local en vez de `loadFlowers()`: recargar el catálogo entero después
  // de cada clic son 25 lecturas de Firestore y una espera que se siente.
  const parchear = (id: string, cambio: Partial<Flower>) =>
    setFlowers((prev) => prev.map((f) => (f.id === id ? { ...f, ...cambio } : f)));

  const toggleStock = async (flower: Flower) => {
    try {
      await setFlowerStock(flower.id, !flower.inStock);
      parchear(flower.id, { inStock: !flower.inStock });
      toast.success(flower.inStock ? 'Marcada sin stock' : 'Marcada con stock');
    } catch (err) {
      console.error('[admin] falló el cambio de stock:', err);
      toast.error('No se pudo actualizar el stock.');
    }
  };

  const toggleArchive = async (flower: Flower) => {
    try {
      await setFlowerArchived(flower.id, !flower.archived);
      parchear(flower.id, { archived: !flower.archived });
      toast.success(flower.archived ? 'Restaurada al catálogo' : 'Archivada');
    } catch (err) {
      console.error('[admin] falló el cambio de visibilidad:', err);
      toast.error('No se pudo actualizar la visibilidad.');
    }
  };

  // ── Edición masiva ────────────────────────────────────────────────────────

  const visibles = flowers.filter((f) => {
    if (filtroCategoria && (f.category ?? '') !== filtroCategoria) return false;
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.category ?? '').toLowerCase().includes(q) ||
      (f.description ?? '').toLowerCase().includes(q)
    );
  });

  const todasVisiblesMarcadas = visibles.length > 0 && visibles.every((f) => marcadas.has(f.id));

  const alternarMarca = (id: string) =>
    setMarcadas((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const alternarTodas = () =>
    setMarcadas(todasVisiblesMarcadas ? new Set() : new Set(visibles.map((f) => f.id)));

  const aplicarEnLote = async (
    patch: Partial<Pick<Flower, 'category' | 'availableIn' | 'inStock' | 'archived'>>,
    exito: string
  ) => {
    const ids = [...marcadas];
    if (ids.length === 0) return;
    setAplicandoLote(true);
    try {
      await conTiempoLimite(bulkUpdateFlowers(ids, patch));
      setFlowers((prev) => prev.map((f) => (marcadas.has(f.id) ? { ...f, ...patch } : f)));
      setMarcadas(new Set());
      toast.success(`${exito} (${ids.length})`);
    } catch (err) {
      console.error('[admin] falló la edición en lote:', err);
      toast.error(mensajeDeError(err), { duration: 8000 });
    } finally {
      setAplicandoLote(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#12100E] flex items-center justify-center">
        <div className="font-script text-4xl text-[#7B7369] animate-pulse">Loleanthe</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EFE8] flex flex-col">
      {/* Admin Header */}
      <header className="bg-[#12100E] border-b border-[#7B7369]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo-wordmark-white.png" alt="Loleanthe" width={200} height={73} className="h-6 w-auto object-contain opacity-70" style={{ width: 'auto' }} />
            <span className="text-[#7B7369] text-xs tracking-widest uppercase font-display hidden sm:block">Panel de Administración</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={handleLogout}
              className="label inline-flex min-h-11 items-center text-bone/55 transition-colors hover:text-bone"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#12100E] border-b border-[#7B7369]/10 px-6">
        <nav aria-label="Secciones del panel" className="max-w-7xl mx-auto flex gap-6">
          {([['catalog', 'Catálogo'], ['pricing', 'Precios'], ['inquiries', 'Solicitudes']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                salirDeFlor(() => {
                  setTab(key);
                  if (key === 'pricing') setPreciosAbierto(true);
                  setMode('list');
                })
              }
              aria-current={tab === key ? 'page' : undefined}
              // Activa e inactiva se distinguían solo por el borde: el texto era
              // el mismo #7B7369 en las dos (4.07:1 sobre el fondo oscuro).
              className={`font-display text-xs tracking-widest uppercase py-4 border-b-2 transition-colors ${tab === key ? 'border-[#F2EFE8] text-[#F2EFE8]' : 'border-transparent text-[#F2EFE8]/60 hover:text-[#F2EFE8]'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Storage warning banner */}
      {storageInfo?.nearLimit && (
        <div className="bg-red-900/90 border-b border-red-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <span className="text-red-300 text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-red-100 font-display text-sm font-medium">
                El almacenamiento ha alcanzado su límite (4.5 GB)
              </p>
              <p className="text-red-300 text-xs mt-1 leading-relaxed">
                No es posible subir más imágenes. Para liberar espacio, elimina algunas imágenes de flores existentes desde el panel de edición. Si necesitas más espacio, avísale a Francisco.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Storage usage bar (subtle, always visible) */}
      {storageInfo && !storageInfo.nearLimit && (
        <div className="bg-[#12100E]/5 border-b border-[#DED8CD] px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="text-[#7B7369] text-xs font-display shrink-0">
              Almacenamiento: {(storageInfo.usedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB / 4.5 GB
            </span>
            <div className="flex-1 h-1 bg-[#DED8CD] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7B7369] rounded-full transition-all"
                style={{ width: `${Math.min((storageInfo.usedBytes / storageInfo.limitBytes) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[#7B7369] text-xs font-display shrink-0">
              {Math.round((storageInfo.usedBytes / storageInfo.limitBytes) * 100)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* =========== CATALOG TAB =========== */}
        {tab === 'catalog' && (
          <>
            {mode === 'list' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="font-display text-3xl text-[#12100E]">Flores del catálogo</h1>
                    <p className="text-[#7B7369] text-sm mt-1">{flowers.filter(f => !f.archived).length} activas · {flowers.filter(f => f.archived).length} archivadas</p>
                  </div>
                  <button
                    onClick={openCreate}
                    className="bg-[#12100E] text-[#F2EFE8] px-6 py-3 font-display text-xs tracking-widest uppercase hover:bg-[#7B7369] transition-all duration-300"
                  >
                    + Nueva flor
                  </button>
                </div>

                {cargandoFlores ? (
                  <p className="py-20 text-center font-serif text-2xl font-light text-muted">Cargando flores…</p>
                ) : errorFlores && flowers.length === 0 ? (
                  <div className="border-l border-ink py-2 pl-4 text-[15px] leading-relaxed text-ink">
                    No se pudieron cargar las flores. Tu catálogo no se borró: es un problema de conexión.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setCargandoFlores(true);
                        loadFlowers();
                      }}
                      className="underline underline-offset-4"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : flowers.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-[#A39C92]">
                    <p className="font-script text-4xl text-[#7B7369] mb-4">Vacío</p>
                    <p className="text-[#7B7369] text-sm mb-6">No hay flores en el catálogo aún.</p>
                    <button onClick={openCreate} className="border border-[#7B7369] text-[#7B7369] px-6 py-2 font-display text-xs tracking-widest uppercase hover:bg-[#7B7369] hover:text-white transition-all">
                      Agregar primera flor
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Búsqueda y filtro. Con 24 flores el filtrado en memoria
                        alcanza y de paso es lo que hace útil "marcar todas". */}
                    <div className="flex flex-col gap-4 border-y border-line py-4 sm:flex-row sm:items-center">
                      <input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o categoría"
                        aria-label="Buscar flor"
                        className="min-h-11 w-full border-0 border-b border-muted/80 bg-transparent py-2 text-base text-ink placeholder:text-muted transition-colors duration-300 focus:border-ink sm:max-w-xs"
                      />
                      <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        aria-label="Filtrar por categoría"
                        className="min-h-11 border-b border-muted/80 bg-transparent text-base text-muted transition-colors focus:border-ink focus:text-ink"
                      >
                        <option value="">Todas las categorías</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.slug} value={c.label}>{c.label}</option>
                        ))}
                      </select>
                      <span className="label text-muted sm:ml-auto">
                        {visibles.length} de {flowers.length}
                      </span>
                    </div>

                    {/* Barra de acciones en lote */}
                    <div className="flex items-center gap-6 border-b border-line py-3">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={todasVisiblesMarcadas}
                          onChange={alternarTodas}
                          className="h-5 w-5 accent-[#12100E]"
                        />
                        <span className="label text-muted">
                          {marcadas.size > 0 ? `${marcadas.size} marcadas` : 'Marcar todas'}
                        </span>
                      </label>
                      {marcadas.size > 0 && (
                        <button onClick={() => setMarcadas(new Set())} className="label inline-flex min-h-11 items-center text-muted transition-colors hover:text-ink">
                          Limpiar
                        </button>
                      )}
                    </div>

                    {marcadas.size > 0 && (
                      <div className="flex flex-col gap-4 border-b border-line bg-paper px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                        <select
                          defaultValue=""
                          disabled={aplicandoLote}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            aplicarEnLote({ category: e.target.value }, 'Categoría aplicada');
                            e.target.value = '';
                          }}
                          className="min-h-11 border-b border-muted/80 bg-transparent text-base text-muted focus:border-ink focus:text-ink"
                        >
                          <option value="">Poner categoría</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.slug} value={c.label}>{c.label}</option>
                          ))}
                        </select>

                        <select
                          defaultValue=""
                          disabled={aplicandoLote}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) return;
                            const paises = v === 'ambos' ? COUNTRIES.map((c) => c.code) : [v as CountryCode];
                            aplicarEnLote({ availableIn: paises }, 'País aplicado');
                            e.target.value = '';
                          }}
                          className="min-h-11 border-b border-muted/80 bg-transparent text-base text-muted focus:border-ink focus:text-ink"
                        >
                          <option value="">Poner país</option>
                          <option value="ambos">Costa Rica y Guatemala</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>Solo {c.label}</option>
                          ))}
                        </select>

                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ inStock: true }, 'Marcadas con stock')} className="label inline-flex min-h-11 items-center text-ink transition-opacity hover:opacity-60 disabled:opacity-40">
                          En stock
                        </button>
                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ inStock: false }, 'Marcadas sin stock')} className="label inline-flex min-h-11 items-center text-ink transition-opacity hover:opacity-60 disabled:opacity-40">
                          Sin stock
                        </button>
                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ archived: true }, 'Archivadas')} className="label inline-flex min-h-11 items-center text-muted transition-colors hover:text-ink disabled:opacity-40">
                          Archivar
                        </button>
                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ archived: false }, 'Restauradas')} className="label inline-flex min-h-11 items-center text-muted transition-colors hover:text-ink disabled:opacity-40">
                          Restaurar
                        </button>
                        {aplicandoLote && <span className="label text-muted">Aplicando…</span>}
                      </div>
                    )}

                    {/* Lista, no tabla: en el celular la tabla de 6 columnas
                        obligaba a desplazar de lado. Acá cada flor es una fila
                        que se reacomoda sola. */}
                    <ul>
                      {visibles.map((flower) => (
                        <li
                          key={flower.id}
                          className={`flex items-start gap-4 border-b border-line py-4 transition-colors hover:bg-paper ${flower.archived ? 'opacity-50' : ''}`}
                        >
                          <label className="-ml-3 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              checked={marcadas.has(flower.id)}
                              onChange={() => alternarMarca(flower.id)}
                              aria-label={`Marcar ${flower.name}`}
                              className="h-5 w-5 accent-[#12100E]"
                            />
                          </label>

                          <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-line">
                            {flower.images[0] ? (
                              <Image src={flower.images[0]} alt={flower.name} fill sizes="56px" className="object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center font-serif text-lg text-muted">L</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-serif text-lg font-light leading-tight text-ink">{flower.name}</p>
                            <p className="label mt-1 text-muted">
                              {[
                                flower.category,
                                flower.archived ? 'Archivada' : null,
                                countryLabels(flower).join(' y ') || null,
                              ]
                                .filter(Boolean)
                                .join(' · ') || 'Sin categoría'}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-6">
                              <button
                                onClick={() => toggleStock(flower)}
                                aria-pressed={flower.inStock}
                                className="label inline-flex min-h-11 items-center"
                              >
                                <span className={`border-b pb-0.5 transition-colors duration-300 ${flower.inStock ? 'border-ink text-ink' : 'border-transparent text-muted'}`}>
                                  {flower.inStock ? 'En stock' : 'Sin stock'}
                                </span>
                              </button>
                              <button onClick={() => openEdit(flower)} className="label inline-flex min-h-11 items-center text-ink transition-opacity hover:opacity-60">
                                Editar
                              </button>
                              {/* Archivar y Eliminar van aparte: lo de todos los días no
                                  queda pegado a lo que no se deshace. */}
                              <Mas>
                                <button onClick={() => toggleArchive(flower)} className="label inline-flex min-h-11 items-center text-muted transition-colors hover:text-ink">
                                  {flower.archived ? 'Restaurar' : 'Archivar'}
                                </button>
                                <button
                                  onClick={() => {
                                    setErrorEliminar('');
                                    setPorEliminar(flower);
                                  }}
                                  className="label inline-flex min-h-11 items-center text-muted transition-colors hover:text-ink"
                                >
                                  Eliminar
                                </button>
                              </Mas>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {visibles.length === 0 && (
                      <p className="py-16 text-center text-[15px] text-muted">
                        Ninguna flor coincide con la búsqueda.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =========== CREATE/EDIT FORM =========== */}
            {(mode === 'create' || mode === 'edit') && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <button
                    onClick={() => salirDeFlor(() => setMode('list'))}
                    className="inline-flex min-h-11 items-center font-display text-xs tracking-widest uppercase text-[#7B7369] hover:text-[#12100E] transition-colors"
                  >
                    ← Volver
                  </button>
                  <h1 className="font-display text-3xl text-[#12100E]">
                    {mode === 'create' ? 'Nueva flor' : `Editando: ${editingFlower?.name}`}
                  </h1>
                </div>

                <form onSubmit={handleSave} className="max-w-2xl space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Nombre de la flor *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Rosa Garden Spirit"
                      className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/60 text-base"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Categoría *</label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] text-base"
                    >
                      <option value="" disabled>Selecciona una categoría</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.label}>{c.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-[#7B7369] mt-2">
                      Define en qué página del catálogo aparecerá esta flor.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Descripción</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe la flor: color, tamaño, características especiales, duración estimada..."
                      className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/60 text-base resize-none"
                    />
                  </div>

                  {/* Atributos de catálogo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Tier (Rosas y Rosas Garden)</label>
                      <select
                        value={form.tier}
                        onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))}
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] text-base"
                      >
                        <option value="">Sin especificar</option>
                        {ROSE_TIERS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Apertura</label>
                      <select
                        value={form.apertura}
                        onChange={(e) => setForm((p) => ({ ...p, apertura: e.target.value }))}
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] text-base"
                      >
                        <option value="">Sin especificar</option>
                        {APERTURAS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Largo del tallo</label>
                      <input
                        type="text"
                        value={form.stemLength}
                        onChange={(e) => setForm((p) => ({ ...p, stemLength: e.target.value }))}
                        placeholder="Ej: 50-70cm"
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/60 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Tamaño de cabeza</label>
                      <input
                        type="text"
                        value={form.headSize}
                        onChange={(e) => setForm((p) => ({ ...p, headSize: e.target.value }))}
                        placeholder="Ej: 5.5 cm"
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/60 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Vida en florero (días)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.vaseLifeDays}
                        onChange={(e) => setForm((p) => ({ ...p, vaseLifeDays: e.target.value }))}
                        placeholder="Ej: 13"
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/60 text-base"
                      />
                    </div>
                  </div>

                  {/* Colores disponibles */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Colores disponibles</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {form.colors.map((color, idx) => (
                        <div key={idx} className="relative">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => updateColor(idx, e.target.value)}
                            className="w-11 h-11 border border-[#A39C92] cursor-pointer p-0"
                            aria-label={`Color ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeColor(idx)}
                            className="absolute -top-3 -right-3 flex h-11 w-11 items-center justify-center text-[10px] leading-none"
                            aria-label="Quitar color"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12100E] text-xs text-[#F2EFE8]">×</span>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addColor}
                        className="w-11 h-11 border border-dashed border-[#A39C92] text-[#7B7369] text-lg flex items-center justify-center hover:border-[#7B7369] transition-colors"
                        aria-label="Agregar color"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-[#7B7369] mt-2">
                      Algunas variedades vienen en varios colores (ej. ranunculus, lisianthus). Agrega uno por cada opción disponible.
                    </p>
                  </div>

                  {/* Dónde está esta flor */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Dónde está esta flor</label>
                    <div className="flex flex-wrap items-center gap-6">
                      {COUNTRIES.map((country) => (
                        <label key={country.code} className="flex min-h-11 items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.availableIn.includes(country.code)}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                availableIn: e.target.checked
                                  ? [...p.availableIn, country.code]
                                  : p.availableIn.filter((c) => c !== country.code),
                              }))
                            }
                            className="w-5 h-5 accent-[#12100E]"
                          />
                          <span className="font-display text-sm text-[#12100E]">{country.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-[#7B7369] mt-2">
                      Marca los países donde llega esta variedad. Si no marcas ninguno, la flor
                      aparece en los dos mercados y la ficha no muestra el dato.
                    </p>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-8">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.inStock}
                      onClick={() => setForm((p) => ({ ...p, inStock: !p.inStock }))}
                      className="flex min-h-11 items-center gap-3 cursor-pointer group"
                    >
                      <span
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.inStock ? 'bg-[#7B7369]' : 'bg-[#A39C92]'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.inStock ? 'left-7' : 'left-1'}`} />
                      </span>
                      <span className="font-display text-sm text-[#12100E]">
                        {form.inStock ? 'En stock' : 'Sin stock'}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.archived}
                      onClick={() => setForm((p) => ({ ...p, archived: !p.archived }))}
                      className="flex min-h-11 items-center gap-3 cursor-pointer group"
                    >
                      <span
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.archived ? 'bg-[#7B7369]' : 'bg-[#A39C92]'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.archived ? 'left-7' : 'left-1'}`} />
                      </span>
                      <span className="font-display text-sm text-[#12100E]">
                        {form.archived ? 'Archivada (oculta)' : 'Visible en catálogo'}
                      </span>
                    </button>
                  </div>

                  {/* Existing images */}
                  {existingImages.length > 0 && (
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-3">
                        Imágenes actuales
                      </label>
                      <p className="mb-3 text-xs text-[#7B7369]">Las fotos que quites se borran cuando guardes los cambios.</p>
                      <div className="flex flex-wrap gap-3">
                        {existingImages.map((url, idx) => (
                          <div key={idx} className="relative w-28 h-28">
                            <Image src={url} alt={`Imagen ${idx + 1}`} fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(url)}
                              aria-label={`Quitar la imagen ${idx + 1}`}
                              className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center bg-[#12100E]/80 text-lg leading-none text-[#F2EFE8]"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New images upload */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-3">
                      {existingImages.length > 0 ? 'Agregar más imágenes' : 'Imágenes'}
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="block w-full border-2 border-dashed border-[#A39C92] p-8 text-center cursor-pointer hover:border-[#7B7369] transition-colors"
                    >
                      <span className="block font-display text-[#12100E] text-base">Toca para elegir fotos</span>
                      <span className="mt-1 block text-xs text-[#7B7369]">JPG, PNG, WebP · Se optimizan solas al subir</span>
                    </button>
                    {/* El paso también se muestra acá: al elegir el archivo el
                        botón de guardar todavía no está activo, así que el
                        aviso de "Preparando la foto" no se llegaba a ver. */}
                    {!saving && paso && (
                      <p className="label mt-3 text-muted">{paso}</p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {imagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative w-28 h-28">
                            <Image src={preview} alt="Preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              aria-label={`Quitar la imagen nueva ${idx + 1}`}
                              className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center bg-[#12100E]/80 text-lg leading-none text-[#F2EFE8]"
                            >
                              ×
                            </button>
                            <span className="absolute bottom-1 left-1 bg-[#7B7369] text-white text-[9px] px-1">Nueva</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save buttons */}
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving || !!paso}
                      className="bg-[#12100E] text-[#F2EFE8] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#7B7369] transition-all duration-500 disabled:opacity-60"
                    >
                      {saving ? paso || 'Guardando…' : paso ? 'Preparando la foto…' : mode === 'create' ? 'Crear flor' : 'Guardar cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => salirDeFlor(() => setMode('list'))}
                      className="inline-flex min-h-11 items-center font-display text-sm tracking-widest uppercase text-[#7B7369] hover:text-[#12100E] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* =========== PRICING TAB =========== */}
        {preciosAbierto && (
          <div hidden={tab !== 'pricing'}>
            <PricingPanel catalogFlowers={flowers} />
          </div>
        )}

        {/* =========== INQUIRIES TAB =========== */}
        {tab === 'inquiries' && (
          <InquiriesPanel />
        )}
      </div>

      {porEliminar && (
        <ConfirmDialog
          open
          eyebrow="Eliminar"
          title={`Eliminar «${porEliminar.name}»`}
          confirmLabel="Eliminar para siempre"
          busyLabel="Eliminando…"
          busy={eliminando}
          error={errorEliminar}
          onConfirm={confirmarEliminar}
          onCancel={() => !eliminando && setPorEliminar(null)}
        >
          <p>
            Se borra la flor y {porEliminar.images.length === 1 ? 'su foto' : `sus ${porEliminar.images.length} fotos`}. No se puede
            deshacer.
          </p>
          <p className="text-[14px] text-muted">Si solo quieres sacarla del catálogo por ahora, usa «Archivar»: se puede restaurar.</p>
        </ConfirmDialog>
      )}

      {salida && (
        <ConfirmDialog
          open
          eyebrow="Cambios sin guardar"
          title="Hay cambios sin guardar"
          confirmLabel="Salir sin guardar"
          cancelLabel="Seguir editando"
          onConfirm={() => {
            const accion = salida;
            setSalida(null);
            accion();
          }}
          onCancel={() => setSalida(null)}
        >
          <p>Si sales ahora, se pierde lo que cambiaste en esta flor, fotos nuevas incluidas.</p>
        </ConfirmDialog>
      )}

      {/* Versión desplegada: si el navegador sirve un bundle viejo desde la
          caché, este número lo delata sin tener que adivinar. Va al pie y
          discreta: es para quien da soporte, no para quien administra. */}
      <p className="label px-6 pb-6 text-center text-muted" title="Versión desplegada">
        Versión {VERSION}
      </p>
    </div>
  );
}

// Inquiries panel component
function InquiriesPanel() {
  const [inquiries, setInquiries] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    buyerType?: string;
    volume?: string;
    message?: string;
    flowers?: Array<{ flowerName: string }>;
    createdAt: { seconds: number };
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
        const { getDb } = await import('@/lib/firebase');
        const q = query(collection(getDb(), 'inquiries'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setInquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as never)));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-center py-16 font-display text-[#7B7369]">Cargando solicitudes...</div>;

  if (error) return <div className="text-center py-16 font-display text-[#7B7369]">No se pudieron cargar las solicitudes. Recarga la página e intenta de nuevo.</div>;

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-script text-4xl text-[#7B7369] mb-4">Vacío</p>
        <p className="text-[#7B7369] text-sm">Aún no hay solicitudes de cotización.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[#12100E]">Solicitudes de cotización</h1>
        <p className="text-[#7B7369] text-sm mt-1">{inquiries.length} solicitudes recibidas</p>
      </div>
      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div key={inq.id} className="border border-[#DED8CD] p-6 hover:border-[#7B7369] transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg text-[#12100E]">{inq.name}</h3>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-[#7B7369]">
                  <a href={`mailto:${inq.email}`} className="hover:text-[#7B7369] transition-colors">
                    {inq.email}
                  </a>
                  {inq.phone && <a href={`tel:${inq.phone}`} className="hover:text-[#7B7369] transition-colors">{inq.phone}</a>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#7B7369] font-display">
                  {inq.createdAt?.seconds
                    ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha no disponible'}
                </span>
              </div>
            </div>

            {(inq.buyerType || inq.volume) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {inq.buyerType && (
                  <span className="border border-[#DED8CD] text-[#12100E] text-xs font-display px-3 py-1">
                    {inq.buyerType}
                  </span>
                )}
                {inq.volume && (
                  <span className="border border-[#DED8CD] text-[#12100E] text-xs font-display px-3 py-1">
                    {inq.volume}
                  </span>
                )}
              </div>
            )}

            {inq.flowers && inq.flowers.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-display tracking-widest uppercase text-[#7B7369] mb-2">Flores de interés:</p>
                <div className="flex flex-wrap gap-2">
                  {inq.flowers.map((f, i) => (
                    <span key={i} className="bg-[#DED8CD] text-[#12100E] text-xs font-display px-3 py-1">
                      {f.flowerName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {inq.message && (
              <p className="text-sm text-[#7B7369] leading-relaxed border-l-2 border-[#DED8CD] pl-4 mt-3">
                {inq.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
