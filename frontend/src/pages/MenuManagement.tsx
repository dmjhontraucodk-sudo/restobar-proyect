import React from 'react';
import { useMenuManagement } from '../hooks/useMenuManagement';
import MenuHeader from '../components/menu/MenuHeader';
import CategorySection from '../components/menu/CategorySection';
import AddCategoryModal from '../components/menu/AddCategoryModal';
import AddPlatoModal from '../components/menu/AddPlatoModal';
import { FilterIcon, RotateCcwIcon } from '../components/icons';
import toast from 'react-hot-toast';
import { type Category, type MenuItem, type TipoCategoria } from '../types';

interface MenuManagementPageProps {
  tipo: TipoCategoria;
}

const MenuManagementPage: React.FC<MenuManagementPageProps> = ({ tipo }) => {
  const {
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
    hasActiveFilters,
    
    // Setters
    setCategoryName,
    setShowCategoryModal,
    setShowItemModal,
    setItemName,
    setItemPrice,
    setItemDescription,
    setItemImagePreview,
    
    // Objeto de Handlers de Filtros
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
    handleCloseModal,
  } = useMenuManagement(tipo);

  const pageTitle = tipo === 'COMIDA' ? 'Gestión de Menú' : 'Gestión de Bebidas & Bar';
  const pageDescription = tipo === 'COMIDA' 
    ? 'Administra las categorías y platos de tu restaurante'
    : 'Administra las categorías y bebidas de tu bar';

  // --- RENDERIZADO DE CARGA Y ERROR ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando menú...</p>
      </div>
    );
  }

  if (apiError && categories.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl mx-4" role="alert">
        <strong className="font-bold">¡Error!</strong>
        <span className="block sm:inline"> No se pudo cargar el menú: {apiError}</span>
      </div>
    );
  }

  // --- RENDERIZADO DE LA PÁGINA ---
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
        categories={categories}
        inactiveItemsCount={inactiveItemsCount}
        onClearFilters={filterHandlers.handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Contenido Principal */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {filteredCategories.map((category: Category) => (
            <CategorySection
              key={category.id}
              category={category}
              onAddItem={handleAddItem}
              onToggleItemStatus={handleToggleItemStatus}
              onToggleWebVisibility={handleToggleWebVisibility}
              onEditItem={handleEditItem}
              onDeleteItem={(item: MenuItem) => toast.error(`Borrar "${item.name}" no implementado.`)}
            />
          ))}

          {/* Estado Vacío */}
          {filteredCategories.length === 0 && !isLoading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <FilterIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No se encontraron {tipo === 'COMIDA' ? 'platos' : 'bebidas'}
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta ajustar los filtros de búsqueda o añade nuevos {tipo === 'COMIDA' ? 'platos' : 'bebidas'} al menú.
              </p>
              <button 
                onClick={filterHandlers.handleClearFilters} 
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <RotateCcwIcon className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </button>
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
        editingCategory={editingCategory}
        isEditing={!!editingItem}
        isUploading={isUploading}
        itemName={itemName}
        onItemNameChange={setItemName}
        itemPrice={itemPrice}
        onItemPriceChange={setItemPrice}
        itemDescription={itemDescription}
        onItemDescriptionChange={setItemDescription}
        itemImagePreview={itemImagePreview}
        onImageChange={handleImageChange}
        onRemoveImage={handleRemoveImage}
        isSubmitting={isSubmitting}
        onSubmit={handleSaveItem}
      />
    </div>
  );
};

export default MenuManagementPage;