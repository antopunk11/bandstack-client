import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit {
  private productService = inject(ProductService);
  public authService = inject(AuthService); // Público para usarlo en el HTML
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  products: any[] = [];
  isLoading = true;

  expandedProductId: number | null = null;
  variantsByProduct: { [productId: number]: any[] } = {};
  stockQuantities: { [variantId: number]: number } = {};
  isUpdatingStock: { [variantId: number]: boolean } = {};

  toastMessage: string | null = null;
  private toastTimeout: any;

  // Edición de Producto
  editForm: FormGroup;
  editingProductId: number | null = null;
  isSaving = false;
  categories = [
    { id: 1, name: 'Ropa' },
    { id: 2, name: 'Música' },
    { id: 3, name: 'Accesorios' }
  ];

  constructor() {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      category_id: [1, Validators.required],
      description: [''],
      base_price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (res) => {
        // Asumimos que tu backend devuelve los datos en la propiedad 'data' de la respuesta JSON
        this.products = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar actualización inmediata de la vista
      },
      error: (err) => {
        console.error('Error cargando el inventario', err);
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar actualización inmediata de la vista
      }
    });
  }

  toggleVariants(productId: number): void {
    if (this.expandedProductId === productId) {
      this.expandedProductId = null;
      return;
    }

    this.expandedProductId = productId;
    // Cargar las variantes solo si no las hemos cargado previamente
    if (!this.variantsByProduct[productId]) {
      this.loadVariants(productId);
    }
  }

  loadVariants(productId: number): void {
    this.productService.getVariants(productId).subscribe({
      next: (res) => {
        this.variantsByProduct[productId] = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando variantes', err)
    });
  }

  updateStock(variant: any): void {
    const qty = this.stockQuantities[variant.id];
    if (!qty || qty === 0) return;

    this.isUpdatingStock[variant.id] = true;
    
    this.productService.addStockMovement({
      variant_id: variant.id,
      type: qty > 0 ? 'purchase' : 'adjustment', // purchase = entrada; adjustment = cuadre manual
      quantity: qty,
      notes: 'Actualización rápida desde Inventario'
    }).subscribe({
      next: () => {
        variant.stock += qty; // Actualizamos la vista local sumando/restando
        this.stockQuantities[variant.id] = 0; // Limpiamos el input
        this.isUpdatingStock[variant.id] = false;
        this.showToast(`Stock actualizado: ${qty > 0 ? '+' : ''}${qty} (${variant.attribute})`);
        this.cdr.detectChanges();
      },
      error: (err) => { this.isUpdatingStock[variant.id] = false; this.cdr.detectChanges(); }
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    
    // Si ya había un toast, limpiamos el temporizador anterior
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000); // Se oculta a los 3 segundos
  }

  editProduct(product: any): void {
    this.editingProductId = product.id;
    this.editForm.patchValue(product);
  }

  cancelEdit(): void {
    this.editingProductId = null;
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingProductId) return;
    this.isSaving = true;
    this.productService.updateProduct(this.editingProductId, this.editForm.value).subscribe({
      next: (res) => {
        const index = this.products.findIndex(p => p.id === this.editingProductId);
        if (index !== -1) this.products[index] = { ...this.products[index], ...res.data };
        this.isSaving = false;
        this.editingProductId = null;
        this.showToast('Producto actualizado con éxito');
        this.cdr.detectChanges();
      },
      error: (err) => { this.isSaving = false; alert('Error al actualizar el producto.'); }
    });
  }

  deleteProduct(product: any): void {
    if (confirm(`¿Seguro que quieres eliminar el producto "${product.name}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.showToast('Producto eliminado');
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar el producto.')
      });
    }
  }
}