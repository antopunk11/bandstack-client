import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'product-create.component.html'
})
export class ProductCreateComponent {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  productForm: FormGroup;
  isSubmitting = false;
  toastMessage: string | null = null;

  // Categorías base según tu seed de SQL
  categories = [
    { id: 1, name: 'Ropa' },
    { id: 2, name: 'Música' },
    { id: 3, name: 'Accesorios' }
  ];

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category_id: [1, Validators.required],
      description: [''],
      base_price: [0, [Validators.required, Validators.min(0)]],
      cost_price: [0, Validators.min(0)],
      variants: this.fb.array([this.createVariantGroup()]) // Empieza con 1 variante vacía por defecto
    });
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  createVariantGroup(): FormGroup {
    return this.fb.group({
      attribute: ['', Validators.required],
      sku: [''],
      price_override: [null] // Nulo para heredar precio base
    });
  }

  addVariant() {
    this.variants.push(this.createVariantGroup());
  }

  removeVariant(index: number) {
    if (this.variants.length > 1) {
      this.variants.removeAt(index);
    }
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    const { variants, ...productData } = this.productForm.value;

    this.productService.createProduct(productData).pipe(
      switchMap((res: any) => {
        const productId = res.data.id;
        
        // Preparamos los datos de las variantes inyectando el ID del producto
        const variantRequests = variants.map((v: any) => 
          this.productService.createVariant({ ...v, product_id: productId })
        );

        // Ejecutamos todas las peticiones de variantes en paralelo
        return forkJoin(variantRequests);
      })
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showToast('¡Producto y variantes creados con éxito!');
        // Retrasamos la redirección brevemente para que se vea el mensaje
        setTimeout(() => {
          this.router.navigate(['/']); // Redirigir al catálogo o dashboard
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al guardar el producto o variantes', err);
      }
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}