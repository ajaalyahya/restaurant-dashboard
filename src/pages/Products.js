// src/pages/Products.js
import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useParams, useNavigate } from "react-router-dom";
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
const EMPTY_FORM = { name: "", desc: "", price: "", cal: "", img: "", category: "" };

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

// ── بطاقة منتج قابلة للسحب ──
const SortableCard = ({ prod, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prod.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="prod-card">
      {/* مقبض السحب */}
      <div className="drag-handle" {...attributes} {...listeners} title="اسحب لتغيير الترتيب">
        ⠿
      </div>
      <div className="prod-img-wrap">
        {prod.img
          ? <img src={prod.img} alt={prod.name} className="prod-img" />
          : <div className="prod-img-fallback">◉</div>}
        <div className="prod-category-badge">{prod.category}</div>
      </div>
      <div className="prod-body">
        <h3 className="prod-name">{prod.name}</h3>
        <p className="prod-desc">{prod.desc}</p>
        <div className="prod-meta">
          <span className="prod-price">{prod.price} ر.س</span>
          <span className="prod-cal">{prod.cal} سعرة</span>
        </div>
        <div className="prod-actions">
          <button className="btn-sm edit" onClick={() => onEdit(prod)}>✏️ تعديل</button>
          <button className="btn-sm del" onClick={() => onDelete(prod.id)}>❌ حذف</button>
        </div>
      </div>
    </div>
  );
};

const Products = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const activeCategory = category || null;

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = activeCategory
        ? query(collection(db, "products"), where("category", "==", activeCategory))
        : collection(db, "products");
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // ترتيب حسب حقل order إذا موجود
      data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    const snap = await getDocs(collection(db, "categories"));
    setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, [activeCategory]);

  // ── سحب وإفلات ──
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    const newOrder = arrayMove(products, oldIndex, newIndex);
    setProducts(newOrder);

    // حفظ الترتيب في Firestore
    setSavingOrder(true);
    try {
      const batch = writeBatch(db);
      newOrder.forEach((prod, index) => {
        batch.update(doc(db, "products", prod.id), { order: index });
      });
      await batch.commit();
    } catch (e) { console.error(e); }
    finally { setSavingOrder(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, category: activeCategory || "" });
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (prod) => {
    setEditTarget(prod);
    setForm({ name: prod.name, desc: prod.desc, price: prod.price, cal: prod.cal, img: prod.img, category: prod.category });
    setImageFile(null);
    setImagePreview(prod.img || "");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let img = form.img;
      if (imageFile) img = await uploadImage(imageFile);
      const data = {
        name: form.name, desc: form.desc, price: form.price,
        cal: Number(form.cal), img, category: form.category,
      };
      if (editTarget) {
        await updateDoc(doc(db, "products", editTarget.id), data);
        setProducts((prev) => prev.map((p) => p.id === editTarget.id ? { ...p, ...data } : p));
      } else {
        const newOrder = products.length;
        const ref = await addDoc(collection(db, "products"), { ...data, order: newOrder });
        if (!activeCategory || data.category === activeCategory)
          setProducts((prev) => [...prev, { id: ref.id, ...data, order: newOrder }]);
      }
      setModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا المنتج؟")) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          {activeCategory && (
            <button className="back-btn" onClick={() => navigate("/dashboard/categories")}>← الأصناف</button>
          )}
          <h1 className="page-title">{activeCategory ? `منتجات: ${activeCategory}` : "جميع المنتجات"}</h1>
          <p className="page-desc">
            {products.length} منتج
            {savingOrder && <span style={{ color: "var(--accent)", marginRight: 8, fontSize: 12 }}>⟳ جاري حفظ الترتيب...</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ إضافة منتج</button>
      </div>

      {/* ── بار الأصناف ── */}
      <div className="cat-tabs" style={{ marginBottom: 28 }}>
        <button
          className={`cat-tab ${!activeCategory ? "active" : ""}`}
          onClick={() => navigate("/dashboard/products")}
        >
          الكل
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`cat-tab ${activeCategory === c.name ? "active" : ""}`}
            onClick={() => navigate(`/dashboard/products/${c.name}`)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="loader" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◉</div>
          <p>لا توجد منتجات بعد</p>
          <button className="btn-primary" onClick={openAdd}>أضف أول منتج</button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={products.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-3">
              {products.map((prod) => (
                <SortableCard key={prod.id} prod={prod} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editTarget ? "تعديل المنتج" : "إضافة منتج جديد"}>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">اسم المنتج</label>
              <input className="form-input" placeholder="مثال: قوري شاي"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">الصنف</label>
              <select className="form-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">اختر صنفًا</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea className="form-input form-textarea" placeholder="وصف المنتج..."
              value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">السعر</label>
              <input type="text" className="form-input" placeholder="مثال: 15 أو صغير 6 / وسط 8 / كبير 10"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">السعرات الحرارية</label>
              <input type="number" className="form-input" placeholder="0"
                value={form.cal} onChange={(e) => setForm({ ...form, cal: e.target.value })} min="0" dir="ltr" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">صورة المنتج</label>
            <div className="upload-area" onClick={() => document.getElementById("prod-file").click()}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="upload-preview" />
                : <div className="upload-placeholder">
                    <span className="upload-icon">⊕</span>
                    <span>اضغط لرفع صورة</span>
                  </div>}
            </div>
            <input id="prod-file" type="file" accept="image/*"
              style={{ display: "none" }} onChange={handleImageChange} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="btn-loader" /> : "حفظ المنتج"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;