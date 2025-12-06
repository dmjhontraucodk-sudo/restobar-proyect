// hooks/useMenuManagement.ts - VERSIÓN CORREGIDA

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useDashboardApi,
  type ApiProduct,
  type ApiCategory,
} from '@shared/api/useDashboardApi';
import {
  type Category,
  type MenuItem,
  type TipoCategoria,
  type InsumoOption,
} from '@shared/types';
import toast from "react-hot-toast";

// --- FUNCIÓN TRANSFORMADORA (CON MEJORAS) ---
const buildCategoryTree = (
  apiCategories: ApiCategory[],
  apiProducts: ApiProduct[]
): Category[] => {
  const productMap = new Map<number, MenuItem[]>();

  // Procesar productos
  (apiProducts || []).forEach((product) => {
    if (!product || !product.categoria_id) {
      console.warn("Producto omitido por datos incompletos:", product);
      return;
    }

    const categoryId = product.categoria_id;
    const categoriaNombre = product.categoriasmenu?.nombre || "Sin Categoría";

    const menuItem: MenuItem = {
      id: product.id.toString(),
      name: product.nombre,
      description: product.descripcion || "",
      price: Number(product.precio),
      disponible: !!product.disponible,
      visible_en_web: !!product.visible_en_web,
      foto_url: product.foto_url,
      categoria: categoriaNombre,
      producto_inventario_id: (product as any).producto_inventario_id,
    };

    if (!productMap.has(categoryId)) {
      productMap.set(categoryId, []);
    }
    productMap.get(categoryId)!.push(menuItem);
  });

  // Construir categorías (incluyendo las vacías)
  return (apiCategories || [])
    .map((apiCategory) => {
      const itemsForCategory = productMap.get(apiCategory.id) || [];
      return {
        id: apiCategory.id.toString(),
        name: apiCategory.nombre,
        items: itemsForCategory.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        ),
      };
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

// --- EL HOOK PRINCIPAL ---
export const useMenuManagement = (tipo: TipoCategoria = "COMIDA") => {
  // --- A. API ---
  const {
    getProducts,
    getCategories,
    createProductWithRecipe,
    createCategory,
    updateProduct,
    updateProductWithRecipe,
    uploadImage,
    getProductosInventario,
    error: apiError,
  } = useDashboardApi();

  // --- B. ESTADOS DE DATOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insumosDisponibles, setInsumosDisponibles] = useState<InsumoOption[]>(
    []
  );
  const [selectedInsumoId, setSelectedInsumoId] = useState<number | null>(null);

  // --- C. ESTADOS DE UI Y FILTROS ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<string>("active");

  // --- D. ESTADOS DE FORMULARIOS ---
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDescription, setItemDescription] = useState("");
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);

  // --- E. CARGA DE DATOS (CON MEJOR MANEJO DE ERRORES) ---
  const loadData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);

      try {
        const [categoriesData, productsData, insumosData] = await Promise.all([
          getCategories(tipo),
          getProducts(tipo),
          getProductosInventario(),
        ]);

        console.log("📊 Datos cargados:", {
          categorias: categoriesData.length,
          productos: productsData.length,
        });

        const nestedData = buildCategoryTree(categoriesData, productsData);
        setCategories(nestedData);

        if (Array.isArray(insumosData)) {
          setInsumosDisponibles(
            insumosData
              .filter((i: any) => i.activo)
              .map((i: any) => ({
                id: i.id,
                nombre: i.nombre,
                stock_actual: i.stock_actual,
                unidad_medida: i.unidad_medida,
              }))
          );
        }
      } catch (err: any) {
        console.error("❌ Error al cargar datos del menú:", err);
        toast.error(`No se pudo cargar: ${err.message}`);
        // No limpiar categorías en caso de error, mantener las que había
      } finally {
        setIsLoading(false);
      }
    },
    [getCategories, getProducts, tipo]
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // --- F. LÓGICA DE FILTROS (MEJORADA) ---
  const filteredCategories = useMemo(() => {
    let categoriesToFilter = [...(categories || [])];

    // Filtrar por categoría seleccionada
    if (selectedCategory !== "all") {
      categoriesToFilter = categoriesToFilter.filter(
        (c) => c && c.id === selectedCategory
      );
    }

    return categoriesToFilter
      .filter(Boolean)
      .map((category) => ({
        ...category,
        items: (category.items || []).filter((item) => {
          if (!item) return false;

          const matchesSearch =
            searchTerm === "" ||
            (item.name || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (item.description || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase());

          const matchesAvailability =
            availabilityFilter === "active"
              ? item.disponible
              : availabilityFilter === "inactive"
              ? !item.disponible
              : true;

          return matchesSearch && matchesAvailability;
        }),
      }))
      .filter((category) => {
        // Si hay búsqueda, solo mostrar categorías con items que coincidan
        if (searchTerm) {
          return category.items.length > 0;
        }
        // Si hay categoría seleccionada, siempre mostrarla (incluso si está vacía)
        if (selectedCategory !== "all") {
          return true;
        }
        // En vista "Todos" con filtro "Activos", solo mostrar categorías con items activos
        if (availabilityFilter === "active" && selectedCategory === "all") {
          return category.items.length > 0;
        }
        // En otros casos, mostrar todas las categorías
        return true;
      });
  }, [categories, searchTerm, selectedCategory, availabilityFilter]);

  const inactiveItemsCount = useMemo(() => {
    return categories.reduce(
      (count, category) =>
        count +
        (category.items || []).filter((item) => item && !item.disponible)
          .length,
      0
    );
  }, [categories]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setAvailabilityFilter("active");
  };

  // --- G. HANDLERS DE ACCIONES DE PRODUCTOS ---
  const handleToggleItemStatus = async (itemId: string) => {
    let producto: MenuItem | undefined;
    const originalCategories = [...categories];
    let categoriaId: string | undefined;

    for (const cat of categories) {
      producto = cat.items.find((i) => i.id === itemId);
      if (producto) {
        categoriaId = cat.id;
        break;
      }
    }
    if (!producto || !categoriaId) return;

    const newStatus = !producto.disponible;
    const newVisibility = newStatus ? producto.visible_en_web : false;

    const updatedCategories = categories.map((cat) => {
      if (cat.id === categoriaId) {
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  disponible: newStatus,
                  visible_en_web: newVisibility,
                }
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
        visible_en_web: newVisibility,
      });
      toast.success(
        newStatus
          ? `"${producto.name}" activado`
          : `"${producto.name}" desactivado`
      );
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err.message}`);
      setCategories(originalCategories);
    }
  };

  const handleToggleWebVisibility = async (itemId: string) => {
    let producto: MenuItem | undefined;
    const originalCategories = [...categories];
    let categoriaId: string | undefined;

    for (const cat of categories) {
      producto = cat.items.find((i) => i.id === itemId);
      if (producto) {
        categoriaId = cat.id;
        break;
      }
    }
    if (!producto || !producto.disponible) return;

    const newVisibility = !producto.visible_en_web;
    const updatedCategories = categories.map((cat) => {
      if (cat.id === categoriaId) {
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? { ...item, visible_en_web: newVisibility }
              : item
          ),
        };
      }
      return cat;
    });
    setCategories(updatedCategories);

    try {
      await updateProduct(itemId, {
        visible_en_web: newVisibility,
      });
      toast.success(
        newVisibility
          ? `"${producto.name}" visible en web`
          : `"${producto.name}" ocultado de la web`
      );
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err.message}`);
      setCategories(originalCategories);
    }
  };

  // --- H. HANDLERS DEL MODAL DE CATEGORÍA (CORREGIDO) ---
  const handleAddCategory = () => {
    setCategoryName("");
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingCategory) return;

    const trimmedName = categoryName.trim();
    if (trimmedName === "") {
      toast.error("El nombre de la categoría no puede estar vacío.");
      return;
    }

    // Validar que no exista una categoría con el mismo nombre
    const categoriaExistente = categories.find(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (categoriaExistente) {
      toast.error(`Ya existe una categoría llamada "${trimmedName}"`);
      return;
    }

    setIsSubmittingCategory(true);

    try {
      console.log("📝 Creando categoría:", { nombre: trimmedName, tipo });

      const nuevaCategoriaApi = await createCategory({
        nombre: trimmedName,
        tipo: tipo,
      });

      console.log("✅ Categoría creada:", nuevaCategoriaApi);

      // Cerrar modal inmediatamente
      setShowCategoryModal(false);
      setCategoryName("");

      // Mostrar toast de éxito
      toast.success(
        `Categoría "${nuevaCategoriaApi.nombre}" añadida correctamente`
      );

      // Recargar datos SIN mostrar loading (experiencia más fluida)
      await loadData(false);
    } catch (err: any) {
      console.error("❌ Error al crear categoría:", err);
      toast.error(`Error al crear categoría: ${err.message}`);
      // NO cerramos el modal para que el usuario pueda reintentar
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // --- I. HANDLERS DEL MODAL DE PLATO ---
  const handleAddItem = (category: Category) => {
    setEditingItem(null);
    setEditingCategory(category);
    setItemName("");
    setItemPrice(0);
    setItemDescription("");
    setItemImagePreview(null);
    setItemImageFile(null);
    setSelectedInsumoId(null);
    setShowItemModal(true);
  };

  const handleEditItem = (itemToEdit: MenuItem) => {
    const parentCategory = categories.find(
      (c) => c.name === itemToEdit.categoria
    );
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
    setItemImagePreview(itemToEdit.foto_url);
    setItemImageFile(null);
    setSelectedInsumoId(itemToEdit.producto_inventario_id || null);
  };

  // --- J. HANDLERS DE IMAGEN ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 10MB");
      return;
    }

    // Limpiar URL anterior
    if (itemImagePreview && itemImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(itemImagePreview);
    }

    setItemImageFile(file);
    setItemImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (itemImagePreview && itemImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(itemImagePreview);
    }
    setItemImagePreview(null);
    setItemImageFile(null);
  };

  // --- K. FUNCIÓN DE GUARDAR ITEM (CON MEJOR MANEJO) ---
  // --- K. FUNCIÓN DE GUARDAR ITEM (CORREGIDA) ---
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploading || isSubmitting) return;

    // Validaciones
    if (
      !editingCategory ||
      !itemName.trim() ||
      itemPrice <= 0 ||
      !itemDescription.trim()
    ) {
      toast.error("Por favor, completa todos los campos obligatorios (*).");
      return;
    }

    let finalImageUrl: string | null = null;

    try {
      // FASE 1: Subir imagen si hay una nueva
      if (itemImageFile) {
        setIsUploading(true);
        console.log("📤 Subiendo imagen...");
        const response = await uploadImage(itemImageFile);
        finalImageUrl = response.url;
        console.log("✅ Imagen subida:", finalImageUrl);
        setIsUploading(false);
      } else {
        finalImageUrl = itemImagePreview;
      }

      // FASE 2: Guardar producto
      setIsSubmitting(true);

      // ✅ OBJETO COMÚN (CORRECTO)
      const commonData = {
        nombre: itemName.trim(),
        precio: itemPrice,
        categoriaNombre: editingCategory.name,
        descripcion: itemDescription.trim(),
        foto_url: finalImageUrl,
        producto_inventario_id: selectedInsumoId, // <--- ¡ESTO ES LO IMPORTANTE!
      };

      if (editingItem) {
        // Actualizar
        console.log("📝 Actualizando producto:", editingItem.id);
        await updateProductWithRecipe(editingItem.id, commonData);
        toast.success(`"${commonData.nombre}" actualizado correctamente`);
      } else {
        // Crear
        console.log("✨ Creando producto nuevo");

        // ✅ USAMOS commonData AQUÍ TAMBIÉN PARA NO OLVIDAR EL CAMPO
        await createProductWithRecipe({
          ...commonData,
          tipo: tipo,
          disponible: true,
          visible_en_web: true,
          receta: [],
        });

        toast.success(`"${commonData.nombre}" creado con éxito`);
      }

      // FASE 3: Cerrar y recargar
      handleCloseModal();
      await loadData(false);
    } catch (err: any) {
      console.error("❌ Error al guardar producto:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  // --- L. FUNCIÓN DE CERRAR MODAL ---
  const handleCloseModal = useCallback(() => {
    if (itemImagePreview && itemImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(itemImagePreview);
    }

    setShowItemModal(false);
    setEditingItem(null);
    setEditingCategory(null);
    setItemName("");
    setItemPrice(0);
    setItemDescription("");
    setItemImagePreview(null);
    setItemImageFile(null);
    setIsUploading(false);
    setIsSubmitting(false);
  }, [itemImagePreview]);

  // --- M. RETORNO DEL HOOK ---
  return {
    // Estados
    isLoading,
    apiError,
    categories,
    filteredCategories,
    allProducts: categories.flatMap(cat => cat.items || []).filter(Boolean),
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
    hasActiveFilters:
      searchTerm !== "" ||
      selectedCategory !== "all" ||
      availabilityFilter !== "active",

    // Setters
    setCategoryName,
    setShowCategoryModal,
    setShowItemModal,
    setItemName,
    setItemPrice,
    setItemDescription,
    setItemImagePreview,
    insumosDisponibles,
    selectedInsumoId,
    setSelectedInsumoId,

    // Objeto de Handlers de Filtros
    filterHandlers: {
      searchTerm,
      setSearchTerm,
      selectedCategory,
      setSelectedCategory,
      availabilityFilter,
      setAvailabilityFilter,
      handleClearFilters,
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
    handleCloseModal,
  };
};
