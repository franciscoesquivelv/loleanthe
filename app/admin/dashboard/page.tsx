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
  type EtapaSubida,
} from '@/lib/flowers';
import { compressImage } from '@/lib/image-compress';
import Image from 'next/image';
import { APERTURAS, COUNTRIES, ROSE_TIERS, countryLabels, type CountryCode, type Flower } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import toast from 'react-hot-toast';

type Tab = 'catalog' | 'inquiries';
type Mode = 'list' | 'create' | 'edit';

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
    return 'El guardado se quedó esperando al servidor y se canceló. Revisa tu conexión y volvé a intentar; la flor NO se guardó.';
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
  return `No se pudo guardar${code ? ` (${code})` : ''}. Mirá la consola del navegador para el detalle.`;
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
  const [mode, setMode] = useState<Mode>('list');
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [editingFlower, setEditingFlower] = useState<Flower | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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
    } catch {
      toast.error('Error al cargar flores');
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
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setMode('create');
  };

  const openEdit = (flower: Flower) => {
    setEditingFlower(flower);
    setForm({
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
    });
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
      compressed = await conTiempoLimite(Promise.all(files.map(compressImage)), 30_000);
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

  const removeExistingImage = async (url: string) => {
    if (!editingFlower) return;
    const updatedImages = existingImages.filter((img) => img !== url);
    try {
      // Primero quitamos la URL del doc; solo si eso tiene éxito borramos el
      // archivo de Storage, para no dejar imágenes rotas en el catálogo.
      await updateFlower(editingFlower.id, { images: updatedImages });
      setExistingImages(updatedImages);
      await deleteFlowerImage(url);
      toast.success('Imagen eliminada');
    } catch {
      toast.error('No se pudo eliminar la imagen. Intenta de nuevo.');
    }
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
      // Firestore rechaza `undefined` explícito, solo se incluyen los atributos con valor.
      const attributes = {
        ...(form.tier && { tier: form.tier as Flower['tier'] }),
        ...(form.apertura && { apertura: form.apertura as Flower['apertura'] }),
        ...(form.stemLength && { stemLength: form.stemLength }),
        ...(form.headSize && { headSize: form.headSize }),
        ...(form.vaseLifeDays && { vaseLifeDays: Number(form.vaseLifeDays) }),
        ...(form.colors.length > 0 && { colors: form.colors }),
        // Este va siempre, incluso vacío: `updateDoc` hace merge, así que si se
        // omitiera, desmarcar las dos casillas no borraría el valor anterior.
        availableIn: form.availableIn,
      };
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
        await conTiempoLimite(
          createFlower(
            { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: [], ...attributes },
            imageFiles,
            avisar
          )
        );
        toast.success('Flor creada exitosamente');
      } else if (editingFlower) {
        await conTiempoLimite(
          updateFlower(
            editingFlower.id,
            { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: existingImages, ...attributes },
            imageFiles,
            avisar
          )
        );
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

  const handleDelete = async (flower: Flower) => {
    if (deleteConfirm !== flower.id) {
      setDeleteConfirm(flower.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    try {
      await deleteFlower(flower.id, flower.images);
      await loadFlowers();
      toast.success('Flor eliminada');
      setDeleteConfirm(null);
    } catch {
      toast.error('Error al eliminar');
    }
  };

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
          <button
            onClick={handleLogout}
            className="font-display text-xs tracking-widest uppercase text-[#7B7369] hover:text-[#7B7369] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#12100E] border-b border-[#7B7369]/10 px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {([['catalog', 'Catálogo'], ['inquiries', 'Solicitudes']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setMode('list'); }}
              className={`font-display text-xs tracking-widest uppercase py-4 border-b-2 transition-all ${tab === key ? 'border-[#7B7369] text-[#7B7369]' : 'border-transparent text-[#7B7369] hover:text-[#7B7369]'}`}
            >
              {label}
            </button>
          ))}
        </div>
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
                No es posible subir más imágenes. Para liberar espacio, elimina algunas imágenes de flores existentes desde el panel de edición. Si necesitas más espacio, contacta al administrador del sistema.
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

                {flowers.length === 0 ? (
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
                        className="w-full border-0 border-b border-line bg-transparent py-2 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-300 focus:border-ink sm:max-w-xs"
                      />
                      <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="label border-b border-line bg-transparent pb-1 text-muted transition-colors focus:border-ink focus:text-ink"
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
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={todasVisiblesMarcadas}
                          onChange={alternarTodas}
                          className="h-4 w-4 accent-[#12100E]"
                        />
                        <span className="label text-muted">
                          {marcadas.size > 0 ? `${marcadas.size} marcadas` : 'Marcar todas'}
                        </span>
                      </label>
                      {marcadas.size > 0 && (
                        <button onClick={() => setMarcadas(new Set())} className="label text-muted transition-colors hover:text-ink">
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
                          className="label border-b border-line bg-transparent pb-1 text-muted focus:border-ink focus:text-ink"
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
                          className="label border-b border-line bg-transparent pb-1 text-muted focus:border-ink focus:text-ink"
                        >
                          <option value="">Poner país</option>
                          <option value="ambos">Costa Rica y Guatemala</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>Solo {c.label}</option>
                          ))}
                        </select>

                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ inStock: true }, 'Marcadas con stock')} className="label text-ink transition-opacity hover:opacity-60 disabled:opacity-40">
                          En stock
                        </button>
                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ inStock: false }, 'Marcadas sin stock')} className="label text-ink transition-opacity hover:opacity-60 disabled:opacity-40">
                          Sin stock
                        </button>
                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ archived: true }, 'Archivadas')} className="label text-muted transition-colors hover:text-ink disabled:opacity-40">
                          Archivar
                        </button>
                        <button disabled={aplicandoLote} onClick={() => aplicarEnLote({ archived: false }, 'Restauradas')} className="label text-muted transition-colors hover:text-ink disabled:opacity-40">
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
                          <input
                            type="checkbox"
                            checked={marcadas.has(flower.id)}
                            onChange={() => alternarMarca(flower.id)}
                            aria-label={`Marcar ${flower.name}`}
                            className="mt-5 h-4 w-4 shrink-0 accent-[#12100E]"
                          />

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

                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                              <button
                                onClick={() => toggleStock(flower)}
                                className={`label border-b pb-0.5 transition-colors duration-300 ${flower.inStock ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
                              >
                                {flower.inStock ? 'En stock' : 'Sin stock'}
                              </button>
                              <button onClick={() => openEdit(flower)} className="label text-ink transition-opacity hover:opacity-60">
                                Editar
                              </button>
                              <button onClick={() => toggleArchive(flower)} className="label text-muted transition-colors hover:text-ink">
                                {flower.archived ? 'Restaurar' : 'Archivar'}
                              </button>
                              <button
                                onClick={() => handleDelete(flower)}
                                className={`label transition-colors ${deleteConfirm === flower.id ? 'text-ink underline underline-offset-4' : 'text-muted hover:text-ink'}`}
                              >
                                {deleteConfirm === flower.id ? '¿Confirmar?' : 'Eliminar'}
                              </button>
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
                    onClick={() => setMode('list')}
                    className="font-display text-xs tracking-widest uppercase text-[#7B7369] hover:text-[#7B7369] transition-colors"
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
                      className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/40 text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Categoría *</label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] text-sm"
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
                      className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/40 text-sm resize-none"
                    />
                  </div>

                  {/* Atributos de catálogo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Tier (solo Rosas)</label>
                      <select
                        value={form.tier}
                        onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))}
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] text-sm"
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
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] text-sm"
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
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/40 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Tamaño de cabeza</label>
                      <input
                        type="text"
                        value={form.headSize}
                        onChange={(e) => setForm((p) => ({ ...p, headSize: e.target.value }))}
                        placeholder="Ej: 5.5 cm"
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/40 text-sm"
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
                        className="w-full border border-[#A39C92] bg-transparent px-4 py-3 font-display text-[#12100E] placeholder:text-[#7B7369]/40 text-sm"
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
                            className="w-10 h-10 border border-[#A39C92] cursor-pointer p-0"
                            aria-label={`Color ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeColor(idx)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none"
                            aria-label="Quitar color"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addColor}
                        className="w-10 h-10 border border-dashed border-[#A39C92] text-[#7B7369] text-lg flex items-center justify-center hover:border-[#7B7369] transition-colors"
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
                        <label key={country.code} className="flex items-center gap-2 cursor-pointer">
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
                            className="w-4 h-4 accent-[#7B7369]"
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
                      className="flex items-center gap-3 cursor-pointer group"
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
                      className="flex items-center gap-3 cursor-pointer group"
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
                      <div className="flex flex-wrap gap-3">
                        {existingImages.map((url, idx) => (
                          <div key={idx} className="relative w-24 h-24 group">
                            <Image src={url} alt={`Imagen ${idx + 1}`} fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(url)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#A39C92] p-8 text-center cursor-pointer hover:border-[#7B7369] transition-colors"
                    >
                      <p className="font-display text-[#7B7369] text-sm">Haz clic para subir imágenes</p>
                      <p className="text-xs text-[#7B7369] mt-1">JPG, PNG, WebP · Se optimizan automáticamente al subir</p>
                    </div>
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
                          <div key={idx} className="relative w-24 h-24 group">
                            <Image src={preview} alt="Preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                      disabled={saving}
                      className="bg-[#12100E] text-[#F2EFE8] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#7B7369] transition-all duration-500 disabled:opacity-60"
                    >
                      {saving ? paso || 'Guardando…' : mode === 'create' ? 'Crear flor' : 'Guardar cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('list')}
                      className="font-display text-sm tracking-widest uppercase text-[#7B7369] hover:text-[#7B7369] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* =========== INQUIRIES TAB =========== */}
        {tab === 'inquiries' && (
          <InquiriesPanel />
        )}
      </div>
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
