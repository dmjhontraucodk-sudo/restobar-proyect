import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  useDashboardApi, 
  type ApiProduct,
  type ApiCategory,
  type CreateProductData,
  type UpdateProductWithRecipeData,
} from './useDashboardApi';
import { 
  type Category, 
  type MenuItem,  
  type TipoCategoria
} from '../types';
import toast from 'react-hot-toast';

// --- FUNCIÓN TRANSFORMADORA ---
// (Sin cambios, tu lógica es correcta)
// --- FUNCIÓN TRANSFORMADORA (AHORA DEFENSIVA) ---
const buildCategoryTree = (
  apiCategories: ApiCategory[], 
  apiProducts: ApiProduct[]
): Category[] => {
  
  const productMap = new Map<number, MenuItem[]>();
  
  // Asegurarnos de que apiProducts no sea nulo
  (apiProducts || []).forEach(product => {
    
    // ✅ DEFENSA 1: Si el producto o su ID de categoría no existen, sáltalo
    if (!product || !product.categoria_id) {
      console.warn('Producto omitido por datos incompletos:', product);
      return;
    }
    
    const categoryId = product.categoria_id;
    
    // ✅ DEFENSA 2: Usar "optional chaining" (el ?. ) por si 'categoriasmenu' es nulo
    const categoriaNombre = product.categoriasmenu?.nombre || 'Sin Categoría';
    
    const menuItem: MenuItem = {
      id: product.id.toString(),
      name: product.nombre,
      description: product.descripcion || "",
      price: Number(product.precio),
      disponible: !!product.disponible,
      visible_en_web: !!product.visible_en_web,
      foto_url: product.foto_url,
      categoria: categoriaNombre, // Usamos la variable segura
    };
    
    if (!productMap.has(categoryId)) {
      productMap.set(categoryId, []);
    }
    productMap.get(categoryId)!.push(menuItem);
  });

  // Asegurarnos de que apiCategories no sea nulo
  return (apiCategories || []).map(apiCategory => {
    const itemsForCategory = productMap.get(apiCategory.id) || [];
    return {
      id: apiCategory.id.toString(),
      name: apiCategory.nombre,
      items: itemsForCategory.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

// --- EL HOOK PRINCIPAL ---
export const useMenuManagement = (tipo: TipoCategoria = 'COMIDA') => {
  // --- A. API ---
  const { 
    getProducts, 
    getCategories,
    createProductWithRecipe,
    createCategory,
    updateProduct,
    updateProductWithRecipe,
    uploadImage,
    error: apiError 
  } = useDashboardApi();
  
  // --- B. ESTADOS DE DATOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- C. ESTADOS DE UI Y FILTROS ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("active");

  // --- D. ESTADOS DE FORMULARIOS (CORREGIDOS) ---
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDescription, setItemDescription] = useState("");
  
  // ✅ ESTADOS DE IMAGEN SEPARADOS
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null); // URL para mostrar (blob: o https:)
  const [itemImageFile, setItemImageFile] = useState<File | null>(null); // Archivo para subir (File)

  // --- E. CARGA DE DATOS ---
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      const [categoriesData, productsData] = await Promise.all([
        getCategories(tipo),
        getProducts(tipo),
      ]);

      const nestedData = buildCategoryTree(categoriesData, productsData);
      setCategories(nestedData);
    } catch (err: any) {
      console.error("Error al cargar datos del menú:", err);
      toast.error(`No se pudo cargar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [getCategories, getProducts, tipo]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // --- F. LÓGICA DE FILTROS ---
  // --- F. LÓGICA DE FILTROS (AHORA DEFENSIVA) ---
    const filteredCategories = useMemo(() => {
    let categoriesToFilter = [...(categories || [])]; // ✅ DEFENSA

    if (selectedCategory !== "all") {
      categoriesToFilter = categoriesToFilter.filter(c => c && c.id === selectedCategory); // ✅ DEFENSA
    }
    
    return categoriesToFilter
    .filter(Boolean) // ✅ DEFENSA: Eliminar categorías nulas
    .map(category => ({
      ...category,
      items: (category.items || []) // ✅ DEFENSA
        .filter(item => {
          // ✅ DEFENSA: Si el item no existe, no lo incluyas
          if (!item) return false; 
          
          const matchesSearch = searchTerm === "" || 
                            (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ DEFENSA
                            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()); // ✅ DEFENSA
          
          const matchesAvailability = 
            availabilityFilter === "active" ? item.disponible :
            availabilityFilter === "inactive" ? !item.disponible :
            true;
          
          return matchesSearch && matchesAvailability;
        })
    }))
    .filter(category => {
      // ... (Tu lógica de filtro aquí está bien)
      if (searchTerm) {
        return category.items.length > 0;
      }
      if (selectedCategory !== "all") {
        return true;
      }
      if (availabilityFilter === "active" && selectedCategory === "all") {
         return category.items.length > 0;
      }
      return true;
    });
  }, [categories, searchTerm, selectedCategory, availabilityFilter]);
  
  const inactiveItemsCount = useMemo(() => {
    return categories.reduce((count, category) => 
      count + category.items.filter(item => !item.disponible).length, 0
    );
  }, [categories]);
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setAvailabilityFilter("active");
  };

  // --- G. HANDLERS DE ACCIONES DE PRODUCTOS (TOGGLES) ---
  // (Sin cambios, tu lógica de UI optimista es buena)
  const handleToggleItemStatus = async (itemId: string) => {
    // ... (Tu código de toggle)
    let producto: MenuItem | undefined;
    const originalCategories = categories;
    let categoriaId: string | undefined;

    for (const cat of categories) {
      producto = cat.items.find(i => i.id === itemId);
      if (producto) {
        categoriaId = cat.id;
        break;
      }
    }
    if (!producto || !categoriaId) return;

    const newStatus = !producto.disponible;
    const newVisibility = newStatus ? producto.visible_en_web : false; 

    const updatedCategories = categories.map(cat => {
      if (cat.id === categoriaId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId 
              ? { ...item, disponible: newStatus, visible_en_web: newVisibility } 
              : item
          ),
        };
      }
      return cat;
    });
    setCategories(updatedCategories);

    try {
      await updateProduct(itemId, { 
        disponible: newStatus,
        visible_en_web: newVisibility 
      });
      toast.success(newStatus ? `"${producto.name}" activado` : `"${producto.name}" desactivado`);
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err.message}`);
      setCategories(originalCategories); 
    }
  };

  const handleToggleWebVisibility = async (itemId: string) => {
    // ... (Tu código de toggle)
    let producto: MenuItem | undefined;
    const originalCategories = categories;
    let categoriaId: string | undefined;

    for (const cat of categories) {
      producto = cat.items.find(i => i.id === itemId);
      if (producto) {
        categoriaId = cat.id;
        break;
      }
    }
    if (!producto || !producto.disponible) return; 

    const newVisibility = !producto.visible_en_web;
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoriaId) {
        return {
          ...cat,
          items: cat.items.map(item =>
            item.id === itemId ? { ...item, visible_en_web: newVisibility } : item
          ),
        };
      }
      return cat;
    });
    setCategories(updatedCategories);

    try {
      await updateProduct(itemId, { 
        visible_en_web: newVisibility 
      });
      toast.success(newVisibility ? `"${producto.name}" visible en web` : `"${producto.name}" ocultado de la web`);
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err.message}`);
      setCategories(originalCategories);
    }
  };

  // --- H. HANDLERS DEL MODAL DE CATEGORÍA ---
 // --- H. HANDLERS DEL MODAL DE CATEGORÍA ---
  const handleAddCategory = () => {
    setCategoryName("");
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCategory) return;
    if (categoryName.trim() === "") {
      toast.error("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsSubmittingCategory(true);
    try {
      const nuevaCategoriaApi = await createCategory({ 
        nombre: categoryName.trim(), 
        tipo: tipo 
      });
      
      // --- ✅ CORRECCIÓN ---
      // 1. Cierra el modal PRIMERO
      setShowCategoryModal(false);
      toast.success(`Categoría "${nuevaCategoriaApi.nombre}" añadida.`);
      
      // 2. Llama a loadData para re-sincronizar (igual que al guardar un plato)
      loadData(false); 

    } catch (err: any) {
      console.error("Error al crear categoría:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // --- I. HANDLERS DEL MODAL DE PLATO (APERTURA) ---
  // (Actualizados para limpiar los nuevos estados)
  
  const handleAddItem = (category: Category) => {
    setEditingItem(null);
    setEditingCategory(category);
    setItemName("");
    setItemPrice(0);
    setItemDescription("");
    setItemImagePreview(null);
    setItemImageFile(null); // ✨ LIMPIAR ARCHIVO
    setShowItemModal(true);
  };

  const handleEditItem = (itemToEdit: MenuItem) => {
    const parentCategory = categories.find(c => c.name === itemToEdit.categoria);
    if (!parentCategory) {
      toast.error("No se pudo encontrar la categoría para este plato.");
      return;
    }

    setShowItemModal(true);
    setEditingItem(itemToEdit);
    setEditingCategory(parentCategory);

    setItemName(itemToEdit.name);
    setItemPrice(itemToEdit.price);
    setItemDescription(itemToEdit.description);
    setItemImagePreview(itemToEdit.foto_url); // ✨ URL existente (https://...)
    setItemImageFile(null); // ✨ No hay archivo nuevo todavía
  };

  // --- J. HANDLERS DE IMAGEN (CORREGIDOS) ---
  // (Esta es la solución principal: rápido y síncrono)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB Límite
      toast.error('La imagen no debe superar los 10MB');
      return;
    }

    // Limpiar la URL de objeto (blob) anterior para evitar fugas de memoria
    if (itemImagePreview && itemImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(itemImagePreview);
    }

    // 1. Guardar el ARCHIVO (para subirlo al guardar)
    setItemImageFile(file);
    // 2. Guardar la VISTA PREVIA (para mostrarla ahora)
    setItemImagePreview(URL.createObjectURL(file));
    
    // ✨ ¡YA NO SE SUBE LA IMAGEN AQUÍ!
    // ✨ ¡YA NO SE ACTIVA isUploading!
  };
  
  const handleRemoveImage = () => {
    // Limpiar la URL de objeto (blob) si existe
    if (itemImagePreview && itemImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(itemImagePreview);
    }
    setItemImagePreview(null);
    setItemImageFile(null); // ✨ Limpiar el archivo
  };

  // --- K. FUNCIÓN DE GUARDAR ITEM (CORREGIDA) ---
  // (Aquí es donde se orquesta la subida y el guardado)

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evitar doble submit
    if (isUploading || isSubmitting) return;
    
    // Validación de campos
    if (!editingCategory || !itemName.trim() || itemPrice <= 0 || !itemDescription.trim()) {
      toast.error("Por favor, completa todos los campos obligatorios (*).");
      return;
    }

    let finalImageUrl: string | null = null;
    
    try {
      // ----- FASE 1: SUBIDA DE IMAGEN (si hay un archivo nuevo) -----
      if (itemImageFile) {
        setIsUploading(true);
        const response = await uploadImage(itemImageFile);
        finalImageUrl = response.url; // URL de Cloudinary
        setIsUploading(false);
      } else {
        // No hay archivo nuevo:
        // - Si es 'https://...' (editando), se usa.
        // - Si es 'null' (imagen quitada), se usa null.
        finalImageUrl = itemImagePreview; 
      }

      // ----- FASE 2: GUARDADO DE PRODUCTO (en tu base de datos) -----
      setIsSubmitting(true);
      
      if (editingItem) {
        // --- Lógica de ACTUALIZACIÓN ---
        const productData: UpdateProductWithRecipeData = {
          nombre: itemName.trim(),
          precio: itemPrice,
          categoriaNombre: editingCategory.name,
          descripcion: itemDescription.trim(),
          foto_url: finalImageUrl,
        };
        await updateProductWithRecipe(editingItem.id, productData);
        toast.success(`Plato "${productData.nombre}" actualizado.`);
      } else {
        // --- Lógica de CREACIÓN ---
        const productData: CreateProductData = {
          nombre: itemName.trim(),
          precio: itemPrice,
          categoriaNombre: editingCategory.name,
          tipo: tipo,
          descripcion: itemDescription.trim(),
          foto_url: finalImageUrl,
          disponible: true,
          visible_en_web: true,
          receta: []
        };
        await createProductWithRecipe(productData);
        toast.success(`Plato "${productData.nombre}" creado con éxito.`);
      }
      
      // ----- FASE 3: ÉXITO Y CIERRE -----
      handleCloseModal(); // ✨ Cierra y limpia el modal
      loadData(false); // Recarga los datos de la lista
      
    } catch (err: any) {
      console.error("Error al guardar el producto:", err);
      toast.error(`Error: ${err.message}`);
      // No cerramos el modal si hay error, para que el usuario pueda reintentar
    } finally {
      // Asegurarse de que ambos spinners estén apagados
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  // --- L. FUNCIÓN DE CERRAR MODAL (LIMPIEZA) ---
  const handleCloseModal = useCallback(() => {
    // Limpiar la URL de objeto (blob) si existe
    if (itemImagePreview && itemImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(itemImagePreview);
    }
    
    // Resetear todos los estados del formulario
    setShowItemModal(false);
    setEditingItem(null);
    setEditingCategory(null);
    setItemName("");
    setItemPrice(0);
    setItemDescription("");
    setItemImagePreview(null);
    setItemImageFile(null); // ✨ LIMPIAR ARCHIVO
    
    // Resetear spinners
    setIsUploading(false);
    setIsSubmitting(false);
  }, [itemImagePreview]); // Dependencia para la limpieza del blob

  // --- M. RETORNO DEL HOOK ---
  return {
    // Estados
    isLoading,
    apiError,
    categories,
    filteredCategories,
    isSubmitting,
    isSubmittingCategory,
    isUploading,
    showCategoryModal,
    categoryName,
    showItemModal,
    editingCategory,
    editingItem,
    itemName,
    itemPrice,
    itemDescription,
    itemImagePreview,
    inactiveItemsCount,
    hasActiveFilters: searchTerm !== "" || selectedCategory !== "all" || availabilityFilter !== "active",

    // Setters (solo los que se exponen directamente)
    setCategoryName,
    setShowCategoryModal,
    setShowItemModal,
    setItemName,
    setItemPrice,
    setItemDescription,
    setItemImagePreview, // Aunque no se usa, lo mantengo por consistencia
    
    // Objeto de Handlers de Filtros
    filterHandlers: {
      searchTerm,
      setSearchTerm,
      selectedCategory,
      setSelectedCategory,
      availabilityFilter,
      setAvailabilityFilter,
      handleClearFilters
    },
    
    // Funciones de Acciones
    handleAddCategory,
    handleSaveCategory,
    handleAddItem,
    handleEditItem,
    handleImageChange,
    handleRemoveImage,
    handleSaveItem,
    handleToggleItemStatus,
    handleToggleWebVisibility,
    handleCloseModal, // ✨ EXPONER EL LIMPIADOR
  };
};