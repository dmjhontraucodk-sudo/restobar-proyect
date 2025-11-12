import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  useDashboardApi, 
  type Insumo,
  type ApiProduct,
  type ApiCategory,
  type CreateProductData,
  type UpdateProductWithRecipeData,
  type ApiProductWithRecipe,
} from './useDashboardApi';
import { 
  type Category, 
  type MenuItem, 
  type RecetaItemUI, 
  type TipoCategoria
} from '../types';
import toast from 'react-hot-toast';

// --- FUNCIÓN TRANSFORMADORA ---
const buildCategoryTree = (
  apiCategories: ApiCategory[], 
  apiProducts: ApiProduct[]
): Category[] => {
  
  const productMap = new Map<number, MenuItem[]>();
  
  apiProducts.forEach(product => {
    const categoryId = product.categoria_id;
    const menuItem: MenuItem = {
      id: product.id.toString(),
      name: product.nombre,
      description: product.descripcion || "",
      price: Number(product.precio),
      disponible: !!product.disponible,
      visible_en_web: !!product.visible_en_web,
      foto_url: product.foto_url,
      categoria: product.categoriasmenu.nombre,
    };
    if (!productMap.has(categoryId)) {
      productMap.set(categoryId, []);
    }
    productMap.get(categoryId)!.push(menuItem);
  });

  return apiCategories.map(apiCategory => {
    const itemsForCategory = productMap.get(apiCategory.id) || [];
    return {
      id: apiCategory.id.toString(),
      name: apiCategory.nombre,
      items: itemsForCategory.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
};

// --- EL HOOK PRINCIPAL ---
export const useMenuManagement = (tipo: TipoCategoria = 'COMIDA') => {
  // --- A. API ---
  const { 
    getProducts, 
    getCategories,
    getInsumos,
    createProductWithRecipe,
    createCategory,
    updateProduct,
    getProductById,
    updateProductWithRecipe,
    uploadImage,
    isLoading: apiIsLoading,
    error: apiError 
  } = useDashboardApi();
  
  // --- B. ESTADOS DE DATOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [allInsumos, setAllInsumos] = useState<Insumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsumos, setIsLoadingInsumos] = useState(true);

  // --- C. ESTADOS DE UI Y FILTROS ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // ✨ NUEVO ESTADO PARA SUBIDA DE IMAGEN
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("active");

  // --- D. ESTADOS DE FORMULARIOS ---
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDescription, setItemDescription] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [currentReceta, setCurrentReceta] = useState<RecetaItemUI[]>([]);
  const [insumoSearch, setInsumoSearch] = useState("");
  const [insumoCantidad, setInsumoCantidad] = useState("0");

  // --- E. CARGA DE DATOS ---
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    if (allInsumos.length === 0) setIsLoadingInsumos(true);

    try {
      // Ahora llamamos a las APIs con el 'tipo'
      const [categoriesData, productsData] = await Promise.all([
        getCategories(tipo),
        getProducts(tipo),
      ]);
      
      if (allInsumos.length === 0) {
        const insumosData = await getInsumos();
        setAllInsumos(insumosData);
      }

      const nestedData = buildCategoryTree(categoriesData, productsData);
      setCategories(nestedData);
    } catch (err: any) {
      console.error("Error al cargar datos del menú:", err);
      toast.error(`No se pudo cargar: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsLoadingInsumos(false);
    }
  }, [getCategories, getProducts, getInsumos, allInsumos.length, tipo]); // <-- ✨ 'tipo' añadido como dependencia

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // --- F. LÓGICA DE FILTROS ---
  const filteredCategories = useMemo(() => {
    let categoriesToFilter = [...categories];

    if (selectedCategory !== "all") {
      categoriesToFilter = categoriesToFilter.filter(c => c.id === selectedCategory);
    }
    
    return categoriesToFilter.map(category => ({
      ...category,
      items: category.items.filter(item => {
        const matchesSearch = searchTerm === "" || 
                            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAvailability = 
          availabilityFilter === "active" ? item.disponible :
          availabilityFilter === "inactive" ? !item.disponible :
          true;
        return matchesSearch && matchesAvailability;
      })
    }))
    .filter(category => {
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
  const handleToggleItemStatus = async (itemId: string) => {
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
      // ✨ Ahora pasamos el 'tipo' (COMIDA o BEBIDA) al crear
  	  const nuevaCategoriaApi = await createCategory({ 
        nombre: categoryName.trim(), 
        tipo: tipo 
      });
  	  const newCategoryForUI: Category = {
  	 	id: nuevaCategoriaApi.id.toString(),
  	 	name: nuevaCategoriaApi.nombre,
  	 	items: []
  	  };
  	  setCategories(prev => [...prev, newCategoryForUI].sort((a,b) => a.name.localeCompare(b.name)));
  	  setShowCategoryModal(false);
  	  toast.success(`Categoría "${nuevaCategoriaApi.nombre}" añadida.`);
  	} catch (err: any) {
  	  console.error("Error al crear categoría:", err);
  	  toast.error(`Error: ${err.message}`);
  	} finally {
  	  setIsSubmittingCategory(false);
  	}
  };

  // --- I. HANDLERS DEL MODAL DE PLATO (CREAR Y EDITAR) ---
  const handleAddItem = (category: Category) => {
    setEditingItem(null);
    setEditingCategory(category);
    setItemName("");
    setItemPrice(0);
    setItemDescription("");
    setItemImage(null);
    setItemImagePreview(null);
    setCurrentReceta([]);
    setInsumoSearch("");
    setInsumoCantidad("0");
    setShowItemModal(true);
  };

  const handleEditItem = async (itemToEdit: MenuItem) => {
    const parentCategory = categories.find(c => c.name === itemToEdit.categoria);
    if (!parentCategory) {
      toast.error("No se pudo encontrar la categoría para este plato.");
      return;
    }

    setIsSubmitting(true);
    setShowItemModal(true);
    setEditingItem(itemToEdit);
    setEditingCategory(parentCategory);

    setItemName(itemToEdit.name);
    setItemPrice(itemToEdit.price);
    setItemDescription(itemToEdit.description);
    setItemImagePreview(itemToEdit.foto_url);
    setItemImage(null);
    
    try {
      const productWithRecipe = await getProductById(itemToEdit.id);
      
      const recetaUI = productWithRecipe.recetas.map((recetaItem: any) => ({
        insumoId: recetaItem.insumos.id,
        nombre: recetaItem.insumos.nombre,
        cantidad: Number(recetaItem.cantidad_usada),
        unidad: recetaItem.insumos.unidad_medida,
      }));
      setCurrentReceta(recetaUI);

    } catch (err: any) {
      toast.error(`Error al cargar la receta: ${err.message}`);
      setCurrentReceta([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInsumoToReceta = () => {
    const cantidadNum = parseFloat(insumoCantidad);
    if (cantidadNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }
    const insumoSeleccionado = allInsumos.find(i => i.nombre.toLowerCase() === insumoSearch.toLowerCase());
    if (!insumoSeleccionado) {
      toast.error(`El insumo "${insumoSearch}" no se encontró en el inventario.`);
      return;
    }
    if (currentReceta.find(item => item.insumoId === insumoSeleccionado.id)) {
      toast.error(`"${insumoSeleccionado.nombre}" ya está en la receta.`);
      return;
    }
    const nuevoItemReceta: RecetaItemUI = {
      insumoId: insumoSeleccionado.id,
      nombre: insumoSeleccionado.nombre,
      cantidad: cantidadNum,
      unidad: insumoSeleccionado.unidad_medida,
    };
    setCurrentReceta([...currentReceta, nuevoItemReceta]);
    setInsumoSearch("");
    setInsumoCantidad("0");
  };

  const handleRemoveInsumo = (insumoIdToRemove: number) => {
    setCurrentReceta(currentReceta.filter(item => item.insumoId !== insumoIdToRemove));
  };

  // --- ✨ HANDLER DE IMAGEN CORREGIDO CON CLOUDINARY ---
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 10MB');
      return;
    }

    // 1. Mostrar preview local inmediatamente
    const localPreviewUrl = URL.createObjectURL(file);
    setItemImagePreview(localPreviewUrl);
    setItemImage(file);
    setIsUploading(true);
    
    try {
      // 2. Subir a Cloudinary
      const response = await uploadImage(file);
      
      // 3. Reemplazar preview local con URL de Cloudinary
      setItemImagePreview(response.url);
      toast.success('Imagen subida con éxito');
    } catch (err: any) {
      console.error('Error subiendo imagen a Cloudinary:', err);
      toast.error(`Error al subir imagen: ${err.message}`);
      // Mantener el preview local como fallback
    } finally {
      setIsUploading(false);
      // Limpiar el objeto URL local para evitar fugas de memoria
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  const handleRemoveImage = () => {
    setItemImage(null);
    setItemImagePreview(null);
  };

  // --- K. FUNCIÓN DE GUARDAR ITEM CORREGIDA ---
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si todavía se está subiendo la imagen
    if (isUploading) {
      toast.error('Espera a que la imagen termine de subirse');
      return;
    }

    if (isSubmitting) return;
    
    if (!editingCategory || !itemName.trim() || itemPrice <= 0 || !itemDescription.trim()) {
      toast.error("Por favor, completa todos los campos obligatorios (*).");
      return;
    }
    
    if (currentReceta.length === 0) {
      toast.error("Debes añadir al menos un ingrediente a la receta.");
      return;
    }

    setIsSubmitting(true);
    
    // Usar la URL de Cloudinary (si se subió) o mantener la existente
    const foto_url = itemImagePreview;

    const recetaParaApi = currentReceta.map(item => ({
      insumoId: item.insumoId,
      cantidad: item.cantidad
    }));

    try {
      if (editingItem) {
        const productData: UpdateProductWithRecipeData = {
          nombre: itemName.trim(),
          precio: itemPrice,
          categoriaNombre: editingCategory.name,
          descripcion: itemDescription.trim(),
          foto_url: foto_url,
          receta: recetaParaApi
        };
        await updateProductWithRecipe(editingItem.id, productData);
        toast.success(`Plato "${productData.nombre}" actualizado.`);
      } else {
        const productData: CreateProductData = {
          nombre: itemName.trim(),
          precio: itemPrice,
          categoriaNombre: editingCategory.name,
          tipo: tipo,
          descripcion: itemDescription.trim(),
          foto_url: foto_url,
          disponible: true,
          visible_en_web: true,
          receta: recetaParaApi
        };
        await createProductWithRecipe(productData);
        toast.success(`Plato "${productData.nombre}" creado con éxito.`);
      }
      
      setShowItemModal(false);
      // Limpiar el formulario
      setItemImage(null);
      setItemImagePreview(null);
      loadData(false);

    } catch (err: any) {
      console.error("Error al guardar el producto:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- L. RETORNO DEL HOOK ---
  return {
    // Estados
    isLoading,
    apiError,
    categories,
    filteredCategories,
    allInsumos,
    isLoadingInsumos,
    isSubmitting,
    isSubmittingCategory,
    isUploading, // ✨ EXPORTAR ESTADO DE SUBIDA
    showCategoryModal,
    categoryName,
    showItemModal,
    editingCategory,
    editingItem,
    itemName,
    itemPrice,
    itemDescription,
    itemImage,
    itemImagePreview,
    currentReceta,
    insumoSearch,
    insumoCantidad,
    inactiveItemsCount,
    hasActiveFilters: searchTerm !== "" || selectedCategory !== "all" || availabilityFilter !== "active",

    // Setters
    setCategoryName,
    setShowCategoryModal,
    setShowItemModal,
    setItemName,
    setItemPrice,
    setItemDescription,
    setItemImagePreview,
    setInsumoSearch,
    setInsumoCantidad,
    setCurrentReceta,
    setEditingCategory,
    
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
    
    // Funciones
    handleAddCategory,
    handleSaveCategory,
    handleAddItem,
    handleEditItem,
    handleAddInsumoToReceta,
    handleRemoveInsumo,
    handleImageChange,
    handleRemoveImage,
    handleSaveItem,
    handleToggleItemStatus,
    handleToggleWebVisibility,
  };
};