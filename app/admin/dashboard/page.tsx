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
import Image from 'next/image';
import type { Flower } from '@/lib/types';
import toast from 'react-hot-toast';

const MAX_MB = 2;

type Tab = 'catalog' | 'inquiries';
type Mode = 'list' | 'create' | 'edit';

const emptyForm = {
  name: '',
  description: '',
  inStock: true,
  archived: false,
  category: '',
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
    });
    setExistingImages([...flower.images]);
    setImageFiles([]);
    setImagePreviews([]);
    setMode('edit');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate size limit (2 MB per image)
    const error = validateImageFiles(files);
    if (error) {
      toast.error(error, { duration: 5000 });
      e.target.value = '';
      return;
    }

    setImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

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
    if (storageInfo?.nearLimit && imageFiles.length > 0) {
      toast.error('El almacenamiento está lleno. Elimina imágenes antes de subir nuevas.', { duration: 6000 });
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        await createFlower(
          { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: [] },
          imageFiles
        );
        toast.success('Flor creada exitosamente');
      } else if (editingFlower) {
        await updateFlower(
          editingFlower.id,
          { name: form.name, description: form.description, inStock: form.inStock, archived: form.archived, category: form.category, images: existingImages },
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
      <div className="min-h-screen bg-[#1C2A22] flex items-center justify-center">
        <div className="font-script text-4xl text-[#8A3B57] animate-pulse">Loleanthe</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E7E8E0] flex flex-col">
      {/* Admin Header */}
      <header className="bg-[#1C2A22] border-b border-[#8A3B57]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="LB" width={120} height={40} className="h-8 w-auto object-contain invert opacity-70" />
            <span className="text-[#8A3B57] text-xs tracking-widest uppercase font-display hidden sm:block">Panel de Administración</span>
          </div>
          <button
            onClick={handleLogout}
            className="font-display text-xs tracking-widest uppercase text-[#5C6960] hover:text-[#8A3B57] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#1C2A22] border-b border-[#8A3B57]/10 px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {([['catalog', 'Catálogo'], ['inquiries', 'Solicitudes']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setMode('list'); }}
              className={`font-display text-xs tracking-widest uppercase py-4 border-b-2 transition-all ${tab === key ? 'border-[#8A3B57] text-[#8A3B57]' : 'border-transparent text-[#5C6960] hover:text-[#8A3B57]'}`}
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
        <div className="bg-[#1C2A22]/5 border-b border-[#DADCD1] px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="text-[#5C6960] text-xs font-display shrink-0">
              Almacenamiento: {(storageInfo.usedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB / 4.5 GB
            </span>
            <div className="flex-1 h-1 bg-[#DADCD1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8A3B57] rounded-full transition-all"
                style={{ width: `${Math.min((storageInfo.usedBytes / storageInfo.limitBytes) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[#5C6960] text-xs font-display shrink-0">
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
                    <h1 className="font-display text-3xl text-[#1C2A22]">Flores del catálogo</h1>
                    <p className="text-[#5C6960] text-sm mt-1">{flowers.filter(f => !f.archived).length} activas · {flowers.filter(f => f.archived).length} archivadas</p>
                  </div>
                  <button
                    onClick={openCreate}
                    className="bg-[#1C2A22] text-[#E7E8E0] px-6 py-3 font-display text-xs tracking-widest uppercase hover:bg-[#8A3B57] transition-all duration-300"
                  >
                    + Nueva flor
                  </button>
                </div>

                {flowers.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-[#8E9C88]">
                    <p className="font-script text-4xl text-[#8A3B57] mb-4">Vacío</p>
                    <p className="text-[#5C6960] text-sm mb-6">No hay flores en el catálogo aún.</p>
                    <button onClick={openCreate} className="border border-[#8A3B57] text-[#8A3B57] px-6 py-2 font-display text-xs tracking-widest uppercase hover:bg-[#8A3B57] hover:text-white transition-all">
                      Agregar primera flor
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#DADCD1]">
                          {['Imagen', 'Nombre', 'Estado', 'Stock', 'Visibilidad', 'Acciones'].map((h) => (
                            <th key={h} className="text-left font-display text-xs tracking-widest uppercase text-[#5C6960] pb-4 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {flowers.map((flower) => (
                          <tr key={flower.id} className={`border-b border-[#DADCD1] group hover:bg-[#E7E8E0] transition-colors ${flower.archived ? 'opacity-50' : ''}`}>
                            {/* Image */}
                            <td className="py-4 pr-4">
                              <div className="w-14 h-14 relative overflow-hidden bg-[#DADCD1] flex-shrink-0">
                                {flower.images[0] ? (
                                  <Image src={flower.images[0]} alt={flower.name} fill className="object-cover" />
                                ) : (
                                  <span className="font-script text-lg text-[#8A3B57] flex items-center justify-center h-full">LB</span>
                                )}
                              </div>
                            </td>
                            {/* Name */}
                            <td className="py-4 pr-4">
                              <p className="font-display text-[#1C2A22] font-medium">{flower.name}</p>
                              {flower.category && <p className="text-xs text-[#5C6960] mt-0.5">{flower.category}</p>}
                              <p className="text-xs text-[#5C6960] mt-0.5 line-clamp-1 max-w-xs">{flower.description}</p>
                            </td>
                            {/* State */}
                            <td className="py-4 pr-4">
                              <span className={`text-xs tracking-wider font-display uppercase px-2 py-1 ${flower.archived ? 'bg-[#DADCD1] text-[#5C6960]' : 'bg-[#1C2A22] text-[#E7E8E0]'}`}>
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
                                className="text-xs tracking-wider font-display uppercase text-[#5C6960] hover:text-[#8A3B57] transition-colors"
                              >
                                {flower.archived ? 'Restaurar' : 'Archivar'}
                              </button>
                            </td>
                            {/* Actions */}
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => openEdit(flower)}
                                  className="font-display text-xs tracking-wider uppercase text-[#1C2A22] hover:text-[#8A3B57] transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(flower)}
                                  className={`font-display text-xs tracking-wider uppercase transition-colors ${deleteConfirm === flower.id ? 'text-red-500 font-semibold' : 'text-[#5C6960] hover:text-red-500'}`}
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
                    className="font-display text-xs tracking-widest uppercase text-[#5C6960] hover:text-[#8A3B57] transition-colors"
                  >
                    ← Volver
                  </button>
                  <h1 className="font-display text-3xl text-[#1C2A22]">
                    {mode === 'create' ? 'Nueva flor' : `Editando: ${editingFlower?.name}`}
                  </h1>
                </div>

                <form onSubmit={handleSave} className="max-w-2xl space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-2">Nombre de la flor *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Rosa Garden Spirit"
                      className="w-full border border-[#8E9C88] bg-transparent px-4 py-3 font-display text-[#1C2A22] placeholder:text-[#8A3B57]/40 text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-2">Categoría (opcional)</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="Ej: Rosas, Exóticas, Silvestres..."
                      className="w-full border border-[#8E9C88] bg-transparent px-4 py-3 font-display text-[#1C2A22] placeholder:text-[#8A3B57]/40 text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-2">Descripción</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe la flor: color, tamaño, características especiales, duración estimada..."
                      className="w-full border border-[#8E9C88] bg-transparent px-4 py-3 font-display text-[#1C2A22] placeholder:text-[#8A3B57]/40 text-sm resize-none"
                    />
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
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.inStock ? 'bg-[#8A3B57]' : 'bg-[#8E9C88]'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.inStock ? 'left-7' : 'left-1'}`} />
                      </span>
                      <span className="font-display text-sm text-[#1C2A22]">
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
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.archived ? 'bg-[#8A3B57]' : 'bg-[#8E9C88]'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.archived ? 'left-7' : 'left-1'}`} />
                      </span>
                      <span className="font-display text-sm text-[#1C2A22]">
                        {form.archived ? 'Archivada (oculta)' : 'Visible en catálogo'}
                      </span>
                    </button>
                  </div>

                  {/* Existing images */}
                  {existingImages.length > 0 && (
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-3">
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
                    <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-3">
                      {existingImages.length > 0 ? 'Agregar más imágenes' : 'Imágenes'}
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#8E9C88] p-8 text-center cursor-pointer hover:border-[#8A3B57] transition-colors"
                    >
                      <p className="font-display text-[#5C6960] text-sm">Haz clic para subir imágenes</p>
                      <p className="text-xs text-[#8A3B57] mt-1">JPG, PNG, WebP · Máximo {MAX_MB} MB por imagen</p>
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
                            <span className="absolute bottom-1 left-1 bg-[#8A3B57] text-white text-[9px] px-1">Nueva</span>
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
                      className="bg-[#1C2A22] text-[#E7E8E0] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#8A3B57] transition-all duration-500 disabled:opacity-60"
                    >
                      {saving ? 'Guardando...' : mode === 'create' ? 'Crear flor' : 'Guardar cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('list')}
                      className="font-display text-sm tracking-widest uppercase text-[#5C6960] hover:text-[#8A3B57] transition-colors"
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

  if (loading) return <div className="text-center py-16 font-display text-[#5C6960]">Cargando solicitudes...</div>;

  if (error) return <div className="text-center py-16 font-display text-[#5C6960]">No se pudieron cargar las solicitudes. Recarga la página e intenta de nuevo.</div>;

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-script text-4xl text-[#8A3B57] mb-4">Vacío</p>
        <p className="text-[#5C6960] text-sm">Aún no hay solicitudes de cotización.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[#1C2A22]">Solicitudes de cotización</h1>
        <p className="text-[#5C6960] text-sm mt-1">{inquiries.length} solicitudes recibidas</p>
      </div>
      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div key={inq.id} className="border border-[#DADCD1] p-6 hover:border-[#8A3B57] transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg text-[#1C2A22]">{inq.name}</h3>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-[#5C6960]">
                  <a href={`mailto:${inq.email}`} className="hover:text-[#8A3B57] transition-colors">
                    {inq.email}
                  </a>
                  {inq.phone && <a href={`tel:${inq.phone}`} className="hover:text-[#8A3B57] transition-colors">{inq.phone}</a>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#5C6960] font-display">
                  {inq.createdAt?.seconds
                    ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha no disponible'}
                </span>
              </div>
            </div>

            {inq.flowers && inq.flowers.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-display tracking-widest uppercase text-[#5C6960] mb-2">Flores de interés:</p>
                <div className="flex flex-wrap gap-2">
                  {inq.flowers.map((f, i) => (
                    <span key={i} className="bg-[#DADCD1] text-[#1C2A22] text-xs font-display px-3 py-1">
                      {f.flowerName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {inq.message && (
              <p className="text-sm text-[#5C6960] leading-relaxed border-l-2 border-[#DADCD1] pl-4 mt-3">
                {inq.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
