// src/pages/Categories.js
import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CLOUD_NAME = "dlcnuokdr";
const UPLOAD_PRESET = "menu_uploads";
const EMPTY_FORM = { name: "", imageUrl: "" };

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST", body: formData,
  });
  const data = await res.json();
  return data.secure_url;
};

// ── بطاقة صنف قابلة للسحب ──
const SortableCard = ({ cat, onEdit, onDelete, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="cat-card" onClick={onClick}>
      <div className="drag-handle" {...attributes} {...listeners}
        onClick={(e) => e.stopPropagation()} title="اسحب لتغيير الترتيب">
        ⠿
      </div>
      <div className="cat-img-wrap">
        {cat.imageUrl
          ? <img src={cat.imageUrl} alt={cat.name} className="cat-img" />
          : <div className="cat-img-fallback">◈</div>}
      </div>
      <div className="cat-body">
        <h3 className="cat-name">{cat.name}</h3>
        <div className="cat-actions">
          <button className="btn-icon edit" onClick={(e) => { e.stopPropagation(); onEdit(e, cat); }}>✏️</button>
          <button className="btn-icon del" onClick={(e) => { e.stopPropagation(); onDelete(e, cat.id); }}>❌</button>
        </div>
      </div>
    </div>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  const fetchCategories = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "categories"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // ── سحب وإفلات ──
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const newOrder = arrayMove(categories, oldIndex, newIndex);
    setCategories(newOrder);

    setSavingOrder(true);
    try {
      const batch = writeBatch(db);
      newOrder.forEach((cat, index) => {
        batch.update(doc(db, "categories", cat.id), { order: index });
      });
      await batch.commit();
    } catch (e) { console.error(e); }
    finally { setSavingOrder(false); }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (e, cat) => {
    e.stopPropagation();
    setEditTarget(cat);
    setForm({ name: cat.name, imageUrl: cat.imageUrl });
    setImageFile(null);
    setImagePreview(cat.imageUrl || "");
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) imageUrl = await uploadImage(imageFile);
      const data = { name: form.name, imageUrl };
      if (editTarget) {
        await updateDoc(doc(db, "categories", editTarget.id), data);
        setCategories((prev) => prev.map((c) => c.id === editTarget.id ? { ...c, ...data } : c));
      } else {
        const newOrder = categories.length;
        const ref = await addDoc(collection(db, "categories"), { ...data, order: newOrder });
        setCategories((prev) => [...prev, { id: ref.id, ...data, order: newOrder }]);
      }
      setModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("هل تريد حذف هذا الصنف؟")) return;
    await deleteDoc(doc(db, "categories", id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">الأصناف</h1>
          <p className="page-desc">
            إدارة أصناف القائمة
            {savingOrder && <span style={{ color: "var(--accent)", marginRight: 8, fontSize: 12 }}>⟳ جاري حفظ الترتيب...</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ إضافة صنف</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loader" /></div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <p>لا توجد أصناف بعد</p>
          <button className="btn-primary" onClick={openAdd}>أضف أول صنف</button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-4">
              {categories.map((cat) => (
                <SortableCard
                  key={cat.id}
                  cat={cat}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/dashboard/products/${cat.name}`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editTarget ? "تعديل الصنف" : "إضافة صنف جديد"}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">اسم الصنف</label>
            <input className="form-input" placeholder="مثال: ماتشا..."
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">صورة الصنف</label>
            <div className="upload-area" onClick={() => document.getElementById("cat-file").click()}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="upload-preview" />
                : <div className="upload-placeholder">
                    <span className="upload-icon">⊕</span>
                    <span>اضغط لرفع صورة</span>
                  </div>}
            </div>
            <input id="cat-file" type="file" accept="image/*"
              style={{ display: "none" }} onChange={handleImageChange} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="btn-loader" /> : "حفظ"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;