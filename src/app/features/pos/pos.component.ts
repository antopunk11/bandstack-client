import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { SaleService } from '../../core/services/sale.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private saleService = inject(SaleService);
  private cdr = inject(ChangeDetectorRef);

  eventId: number | null = null;
  products: any[] = [];
  variantsByProduct: { [productId: number]: any[] } = {};
  selectedProduct: any = null; // Controla el modal de Tallas

  cart: any[] = []; // Array de items en el carrito
  showCart = false;
  isProcessing = false;
  toastMessage: string | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['event_id']) {
        this.eventId = +params['event_id'];
      }
      this.loadProducts();
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(res => {
      this.products = res.data || [];
      this.cdr.detectChanges();
    });
  }

  // Al pulsar un producto, se cargan sus tallas
  selectProduct(product: any) {
    this.selectedProduct = product;
    if (!this.variantsByProduct[product.id]) {
      this.productService.getVariants(product.id).subscribe(res => {
        this.variantsByProduct[product.id] = res.data || [];
        this.cdr.detectChanges();
      });
    }
  }

  // Añadir una talla al carrito
  addToCart(variant: any) {
    const price = variant.price_override !== null ? variant.price_override : this.selectedProduct.base_price;
    const existing = this.cart.find(i => i.variant_id === variant.id);
    
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        variant_id: variant.id,
        name: this.selectedProduct.name,
        attribute: variant.attribute,
        price: price,
        quantity: 1
      });
    }
    this.showToast(`+ Añadido: ${variant.attribute}`);
    this.selectedProduct = null; // Cierra el modal de tallas automáticamente
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  get cartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  checkout(paymentMethod: string) {
    if (this.cart.length === 0) return;
    
    this.isProcessing = true;
    const saleData = {
      event_id: this.eventId,
      total_amount: this.cartTotal,
      payment_method: paymentMethod, // 'cash', 'bizum', 'card'
      items: this.cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity, price: i.price }))
    };

    this.saleService.createSale(saleData).subscribe({
      next: () => {
        this.isProcessing = false;
        this.cart = [];
        this.showCart = false;
        this.showToast('✅ ¡Venta registrada y descontada!');
      },
      error: () => {
        this.isProcessing = false;
        alert('Error al registrar la venta. Revisa tu conexión.');
      }
    });
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMessage = null; this.cdr.detectChanges(); }, 1500);
  }
}