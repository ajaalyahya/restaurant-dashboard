// src/pages/Products.js
import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Modal from "../components/Modal";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ryal from "../assets/ryal.png";

const CLOUD_NAME  = "dlcnuokdr";
const UPLOAD_PRESET = "menu_uploads";
const EMPTY_FORM  = { 
  name: "", desc: "", price: "", cal: "", img: "", category: "", branch: "main",
  walkMinutes: "", runMinutes: "", caffeine: ""
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
};

const SortableCard = ({ prod, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prod.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="prod-card">
      <div className="drag-handle" {...attributes} {...listeners} title="اسحب">⠿</div>
      <div className="prod-img-wrap">
        {prod.img ? <img src={prod.img} alt={prod.name} className="prod-img" /> : <div className="prod-img-fallback">◉</div>}
        <div className="prod-category-badge">{prod.category}</div>
      </div>
      <div className="prod-body">
        <h3 className="prod-name">{prod.name}</h3>
        <p className="prod-desc">{prod.desc}</p>
        <div className="prod-meta" style={{ flexWrap: "wrap", gap: "6px" }}>
          <span className="prod-price">{prod.price} <img src={ryal} alt="SAR" style={{ width: 14, height: 14, objectFit: "contain", display: "inline" }} /></span>
          <span className="prod-cal">{prod.cal} سعرة</span>
          {Boolean(prod.walkMinutes) && <span style={{ fontSize: "11px", color: "var(--text2)" }}>🚶‍♂️ {prod.walkMinutes} د مشي</span>}
          {Boolean(prod.runMinutes) && <span style={{ fontSize: "11px", color: "var(--text2)" }}>🏃‍♂️ {prod.runMinutes} د جري</span>}
          {Boolean(prod.caffeine) && <span style={{ fontSize: "11px", color: "var(--text2)" }}>☕ {prod.caffeine} ملجم</span>}
        </div>
        <div className="prod-actions">
          <button className="btn-sm edit" onClick={() => onEdit(prod)}>✏️ تعديل</button>
          <button className="btn-sm del"  onClick={() => onDelete(prod.id)}>❌ حذف</button>
        </div>
      </div>
    </div>
  );
};

const Products = () => {
  const { category } = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  const isAramco = location.pathname.includes("aramco");
  const branch   = isAramco ? "aramco" : "main";

  const activeCategory = !category || category === "aramco" ? null : category;

  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM, branch });
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const all  = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const filtered = all.filter((p) => {
        const branchMatch = p.branch === branch || p.branch === "both" || (!p.branch && branch === "main");
        const catMatch    = activeCategory ? p.category === activeCategory : true;
        return branchMatch && catMatch;
      });

      filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setProducts(filtered);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    const snap = await getDocs(collection(db, "categories"));
    const all  = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = all.filter((c) =>
      c.branch === branch || c.branch === "both" || (!c.branch && branch === "main")
    );
    filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    setCategories(filtered);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, [location.pathname]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    const newOrder = arrayMove(products, oldIndex, newIndex);
    setProducts(newOrder);
    setSavingOrder(true);
    try {
      const batch = writeBatch(db);
      newOrder.forEach((prod, index) => batch.update(doc(db, "products", prod.id), { order: index }));
      await batch.commit();
    } catch (e) { console.error(e); }
    finally { setSavingOrder(false); }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, category: activeCategory || "", branch });
    setImageFile(null); setImagePreview(""); setModalOpen(true);
  };

  const openEdit = (prod) => {
    setEditTarget(prod);
    setForm({ 
      name: prod.name || "", 
      desc: prod.desc || "", 
      price: prod.price || "", 
      cal: prod.cal || "", 
      img: prod.img || "", 
      category: prod.category || "", 
      branch: prod.branch || branch,
      walkMinutes: prod.walkMinutes ?? "",
      runMinutes: prod.runMinutes ?? "",
      caffeine: prod.caffeine ?? ""
    });
    setImageFile(null); setImagePreview(prod.img || ""); setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      let img = form.img;
      if (imageFile) img = await uploadImage(imageFile);
      const data = {
        name: form.name, 
        desc: form.desc, 
        price: form.price,
        cal: Number(form.cal) || 0, 
        img, 
        category: form.category, 
        branch: form.branch,
        walkMinutes: form.walkMinutes !== "" ? Number(form.walkMinutes) : null,
        runMinutes: form.runMinutes !== "" ? Number(form.runMinutes) : null,
        caffeine: form.caffeine !== "" ? Number(form.caffeine) : null,
      };
      if (editTarget) {
        await updateDoc(doc(db, "products", editTarget.id), data);
        setProducts((prev) => prev.map((p) => p.id === editTarget.id ? { ...p, ...data } : p));
      } else {
        const newOrder = products.length;
        const ref = await addDoc(collection(db, "products"), { ...data, order: newOrder });
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

  const backPath   = isAramco ? "/dashboard/categories/aramco" : "/dashboard/categories";
  const allTabPath = isAramco ? "/dashboard/products/aramco"   : "/dashboard/products";
  const catTabPath = (name) => isAramco
    ? `/dashboard/products/aramco/${name}`
    : `/dashboard/products/${name}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          {activeCategory && (
            <button className="back-btn" onClick={() => navigate(backPath)}>← الأصناف</button>
          )}
          <h1 className="page-title">
            {activeCategory ? `منتجات: ${activeCategory}` : "جميع المنتجات"}
            <span style={{ fontSize: 14, marginRight: 8, color: "var(--text2)" }}>
              {isAramco ? "— أرامكو 🏭" : "— رئيسي 🏠"}
            </span>
          </h1>
          <p className="page-desc">
            {products.length} منتج
            {savingOrder && <span style={{ color: "var(--accent)", marginRight: 8, fontSize: 12 }}>⟳ جاري حفظ الترتيب...</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ إضافة منتج</button>
      </div>

      <div className="cat-tabs">
        <button className={`cat-tab ${!activeCategory ? "active" : ""}`} onClick={() => navigate(allTabPath)}>
          الكل
        </button>
        {categories.map((c) => (
          <button key={c.id}
            className={`cat-tab ${activeCategory === c.name ? "active" : ""}`}
            onClick={() => navigate(catTabPath(c.name))}>
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
            <label className="form-label">الفرع</label>
            <select className="form-input" value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}>
              <option value="main">الفرع الرئيسي</option>
              <option value="aramco">فرع أرامكو</option>
              <option value="both">الاثنين</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea className="form-input form-textarea" placeholder="وصف المنتج..."
              value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">السعر</label>
              <input type="text" className="form-input" placeholder="مثال: 15"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">السعرات الحرارية</label>
              <input type="number" className="form-input" placeholder="0"
                value={form.cal} onChange={(e) => setForm({ ...form, cal: e.target.value })} min="0" dir="ltr" />
            </div>
          </div>

          {/* 🌟 الخانات الرياضية والصحية الجديدة 🌟 */}
          <div className="form-row" style={{ marginTop: "10px" }}>
            <div className="form-group">
              <label className="form-label">🚶‍♂️ دقائق المشي (اختياري)</label>
              <input type="number" className="form-input" placeholder="مثال: 20"
                value={form.walkMinutes} onChange={(e) => setForm({ ...form, walkMinutes: e.target.value })} min="0" dir="ltr" />
            </div>
            <div className="form-group">
              <label className="form-label">🏃‍♂️ دقائق الجري (اختياري)</label>
              <input type="number" className="form-input" placeholder="مثال: 10"
                value={form.runMinutes} onChange={(e) => setForm({ ...form, runMinutes: e.target.value })} min="0" dir="ltr" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">☕ الكافيين ملجم (اختياري)</label>
            <input type="number" className="form-input" placeholder="مثال: 40"
              value={form.caffeine} onChange={(e) => setForm({ ...form, caffeine: e.target.value })} min="0" dir="ltr" />
          </div>

          <div className="form-group">
            <label className="form-label">صورة المنتج</label>
            <div className="upload-area" onClick={() => document.getElementById("prod-file").click()}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="upload-preview" />
                : <div className="upload-placeholder"><span className="upload-icon">⊕</span><span>اضغط لرفع صورة</span></div>}
            </div>
            <input id="prod-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
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