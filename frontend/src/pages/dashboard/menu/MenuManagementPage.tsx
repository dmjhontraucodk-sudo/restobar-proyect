// src/pages/MenuManagementPage.tsx - VERSIÓN MEJORADA
import React from "react";
import { useMenuManagement } from "@features/menu/model/useMenuManagement";
import { useGlobalConfig } from "@shared/hooks/useGlobalConfig"; // ✅ IMPORTAR
import {
  MenuHeader,
  CategorySection,
  AddCategoryModal,
  AddPlatoModal,
  ConfirmDeleteModal,
} from "@features/menu";
import { FilterIcon, RotateCcwIcon } from "@shared/ui/Icons";
import { type Category, type TipoCategoria } from '@shared/types';

interface MenuManagementPageProps {
  tipo: TipoCategoria;
}

const MenuManagementPage: React.FC<MenuManagementPageProps> = ({ tipo }) => {
  const { formatCurrency, moneda } = useGlobalConfig(); // ✅ USAR HOOK
  const {
    // Estados
    isLoading,
    apiError,
    categories,
    filteredCategories,

    insumosDisponibles,
    selectedInsumoId,
    setSelectedInsumoId,
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
    itemPromoPrice, // ✅ NUEVO
    itemDescription,
    itemImagePreview,
    inactiveItemsCount,
    hasActiveFilters,

    // Setters
    setCategoryName,
    setShowCategoryModal,
    setItemName,
    setItemPrice,
    setItemPromoPrice, // ✅ NUEVO
    setItemDescription,

    // Handlers de Filtros
    filterHandlers,

    // Funciones
    handleAddCategory,
    handleSaveCategory,
    handleAddItem,
    handleEditItem,
    handleImageChange,
    handleRemoveImage,
    handleSaveItem,
    handleToggleItemStatus,
    handleToggleWebVisibility,
    handleDeleteItem,
    handleConfirmDelete,
    handleCancelDelete,
    handleCloseModal,
    itemToDelete,
    isDeleting,
  } = useMenuManagement(tipo);

  const pageTitle =
    tipo === "COMIDA" ? "Gestión de Menú" : "Gestión de Bebidas & Bar";
  const pageDescription =
    tipo === "COMIDA"
      ? "Administra las categorías y platos de tu restaurante"
      : "Administra las categorías y bebidas de tu bar";

  // --- RENDERIZADO DE CARGA ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-600 font-medium">Cargando menú...</p>
        <p className="text-sm text-gray-500 mt-2">
          Por favor espera un momento
        </p>
      </div>
    );
  }

  // --- RENDERIZADO DE ERROR CRÍTICO ---
  if (apiError && (!categories || categories.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md w-full">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-900 mb-2 text-center">
            Error al Cargar el Menú
          </h3>
          <p className="text-red-700 text-center mb-6">{apiError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ✅ VALIDACIÓN DEFENSIVA: Asegurar que categories y filteredCategories sean arrays
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeFilteredCategories = Array.isArray(filteredCategories)
    ? filteredCategories
    : [];

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header y Filtros */}
      <MenuHeader
        title={pageTitle}
        description={pageDescription}
        onAddCategory={handleAddCategory}
        searchTerm={filterHandlers.searchTerm}
        onSearchChange={filterHandlers.setSearchTerm}
        selectedCategory={filterHandlers.selectedCategory}
        onCategoryChange={filterHandlers.setSelectedCategory}
        availabilityFilter={filterHandlers.availabilityFilter}
        onAvailabilityChange={filterHandlers.setAvailabilityFilter}
        categories={safeCategories}
        inactiveItemsCount={inactiveItemsCount}
        onClearFilters={filterHandlers.handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Contenido Principal */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* ✅ ALERTA SI HAY ERROR PERO HAY DATOS CACHEADOS */}
        {apiError && safeCategories.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium">
                  Mostrando datos guardados. Algunos cambios recientes pueden no
                  estar visibles.
                </p>
                <p className="text-xs text-yellow-700 mt-1">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Categorías */}
        <div className="space-y-6">
          {safeFilteredCategories.length > 0 ? (
            safeFilteredCategories.map((category: Category) => (
              <CategorySection
                key={category.id}
                category={category}
                moneda={moneda} // ✅ Pasar moneda
                formatCurrency={formatCurrency} // ✅ Pasar función
                onAddItem={handleAddItem}
                onToggleItemStatus={handleToggleItemStatus}
                onToggleWebVisibility={handleToggleWebVisibility}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
              />
            ))
          ) : (
            // Estado Vacío
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <FilterIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {hasActiveFilters
                  ? `No se encontraron ${
                      tipo === "COMIDA" ? "platos" : "bebidas"
                    }`
                  : `No hay ${
                      tipo === "COMIDA" ? "categorías" : "categorías"
                    } creadas`}
              </h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? `Intenta ajustar los filtros de búsqueda o añade nuevos ${
                      tipo === "COMIDA" ? "platos" : "bebidas"
                    } al menú.`
                  : `Comienza creando una categoría para organizar tu ${
                      tipo === "COMIDA" ? "menú" : "carta de bebidas"
                    }.`}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={filterHandlers.handleClearFilters}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  <RotateCcwIcon className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </button>
              ) : (
                <button
                  onClick={handleAddCategory}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Crear Primera Categoría
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categoryName={categoryName}
        onCategoryNameChange={setCategoryName}
        isSubmitting={isSubmittingCategory}
        onSubmit={handleSaveCategory}
      />

      <AddPlatoModal
        isOpen={showItemModal}
        onClose={handleCloseModal}
        monedaSimbolo={moneda.simbolo} // ✅ Pasar símbolo
        editingCategory={editingCategory}
        isEditing={!!editingItem}
        isUploading={isUploading}
        itemName={itemName}
        onItemNameChange={setItemName}
        itemPrice={itemPrice}
        onItemPriceChange={setItemPrice}
        itemPromoPrice={itemPromoPrice} // ✅ NUEVO
        onItemPromoPriceChange={setItemPromoPrice} // ✅ NUEVO
        itemDescription={itemDescription}
        onItemDescriptionChange={setItemDescription}
        insumos={insumosDisponibles}
        selectedInsumoId={selectedInsumoId}
        onInsumoChange={setSelectedInsumoId}
        itemImagePreview={itemImagePreview}
        onImageChange={handleImageChange}
        onRemoveImage={handleRemoveImage}
        isSubmitting={isSubmitting}
        onSubmit={handleSaveItem}
      />

      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        itemName={itemToDelete?.name ?? ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default MenuManagementPage;
