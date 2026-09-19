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
} from '@/lib/flowers';
import { compressImage } from '@/lib/image-compress';
import Image from 'next/image';
import type { Flower } from '@/lib/types';
import { APERTURAS, ROSE_TIERS } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import toast from 'react-hot-toast';

type Tab = 'catalog' | 'inquiries';
type Mode = 'list' | 'create' | 'edit';

const emptyForm = {
  name: '',
  description: '',
  inStock: true,
  archived: false,
  category: '',
  tier: '',
  apertura: '',
  stemLength: '',
  vaseLifeDays: '',
  colors: [] as string[],
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
      vaseLifeDays: flower.vaseLifeDays?.toString() || '',
      colors: flower.colors || [],
    });
    setExistingImages([...flower.images]);
    setImageFiles([]);
    setImagePreviews([]);
    setMode('edit');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Downscale + re-encode client-side first, then enforce the size limit on
    // the result — so a large photo straight off a phone still goes through.
    const compressed = await Promise.all(files.map(compressImage));

    const error = validateImageFiles(compressed);
    if (error) {
      toast.error(error, { duration: 5000 });
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
      // Firestore rechaza `undefined` explícito — solo se incluyen los atributos con valor.
      const attributes = {
        ...(form.tier && { tier: form.tier as Flower['tier'] }),
        ...(form.apertura && { apertura: form.apertura as Flower['apertura'] }),
        ...(form.stemLength && { stemLength: form.stemLength }),
        ...(form.vaseLifeDays && { vaseLifeDays: Number(form.vaseLifeDays) }),
        ...(form.colors.length > 0 && { colors: form.colors }),
      };
      if (mode === 'create') {
        await createFlower(
          { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: [], ...attributes },
          imageFiles
        );
        toast.success('Flor creada exitosamente');
      } else if (editingFlower) {
        await updateFlower(
          editingFlower.id,
          { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: existingImages, ...attributes },
          imageFiles
        );
        toast.success('Flor actualizada');
      }
      await loadFlowers();
      setMode('list');
    } catch {
      toast.error('Error al guardar la flor');
    } finally {
      setSaving(false);
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

  const toggleStock = async (flower: Flower) => {
    try {
      await setFlowerStock(flower.id, !flower.inStock);
      await loadFlowers();
      toast.success(flower.inStock ? 'Marcada sin stock' : 'Marcada con stock');
    } catch {
      toast.error('No se pudo actualizar el stock.');
    }
  };

  const toggleArchive = async (flower: Flower) => {
    try {
      await setFlowerArchived(flower.id, !flower.archived);
      await loadFlowers();
      toast.success(flower.archived ? 'Restaurada al catálogo' : 'Archivada');
    } catch {
      toast.error('No se pudo actualizar la visibilidad.');
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
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#DED8CD]">
                          {['Imagen', 'Nombre', 'Estado', 'Stock', 'Visibilidad', 'Acciones'].map((h) => (
                            <th key={h} className="text-left font-display text-xs tracking-widest uppercase text-[#7B7369] pb-4 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {flowers.map((flower) => (
                          <tr key={flower.id} className={`border-b border-[#DED8CD] group hover:bg-[#F2EFE8] transition-colors ${flower.archived ? 'opacity-50' : ''}`}>
                            {/* Image */}
                            <td className="py-4 pr-4">
                              <div className="w-14 h-14 relative overflow-hidden bg-[#DED8CD] flex-shrink-0">
                                {flower.images[0] ? (
                                  <Image src={flower.images[0]} alt={flower.name} fill className="object-cover" />
                                ) : (
                                  <span className="font-script text-lg text-[#7B7369] flex items-center justify-center h-full">LB</span>
                                )}
                              </div>
                            </td>
                            {/* Name */}
                            <td className="py-4 pr-4">
                              <p className="font-display text-[#12100E] font-medium">{flower.name}</p>
                              {flower.category && <p className="text-xs text-[#7B7369] mt-0.5">{flower.category}</p>}
                              <p className="text-xs text-[#7B7369] mt-0.5 line-clamp-1 max-w-xs">{flower.description}</p>
                            </td>
                            {/* State */}
                            <td className="py-4 pr-4">
                              <span className={`text-xs tracking-wider font-display uppercase px-2 py-1 ${flower.archived ? 'bg-[#DED8CD] text-[#7B7369]' : 'bg-[#12100E] text-[#F2EFE8]'}`}>
                                {flower.archived ? 'Archivada' : 'Activa'}
                              </span>
                            </td>
                            {/* Stock */}
                            <td className="py-4 pr-4">
                              <button
                                onClick={() => toggleStock(flower)}
                                className={`text-xs tracking-wider font-display uppercase px-2 py-1 border transition-all ${flower.inStock ? 'border-green-600 text-green-700 hover:bg-green-600 hover:text-white' : 'border-red-400 text-red-500 hover:bg-red-500 hover:text-white'}`}
                              >
                                {flower.inStock ? 'En stock' : 'Sin stock'}
                              </button>
                            </td>
                            {/* Visibility */}
                            <td className="py-4 pr-4">
                              <button
                                onClick={() => toggleArchive(flower)}
                                className="text-xs tracking-wider font-display uppercase text-[#7B7369] hover:text-[#7B7369] transition-colors"
                              >
                                {flower.archived ? 'Restaurar' : 'Archivar'}
                              </button>
                            </td>
                            {/* Actions */}
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => openEdit(flower)}
                                  className="font-display text-xs tracking-wider uppercase text-[#12100E] hover:text-[#7B7369] transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(flower)}
                                  className={`font-display text-xs tracking-wider uppercase transition-colors ${deleteConfirm === flower.id ? 'text-red-500 font-semibold' : 'text-[#7B7369] hover:text-red-500'}`}
                                >
                                  {deleteConfirm === flower.id ? '¿Confirmar?' : 'Eliminar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        <option value="">— Sin especificar —</option>
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
                        <option value="">— Sin especificar —</option>
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
                      Algunas variedades vienen en varios colores (ej. ranunculus, lisianthus) — agrega uno por cada opción disponible.
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
                      {saving ? 'Guardando...' : mode === 'create' ? 'Crear flor' : 'Guardar cambios'}
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
                    ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha no disponible'}
                </span>
              </div>
            </div>

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
