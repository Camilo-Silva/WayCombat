import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactInfo, FAQ } from '../../models/contact.model';
import { ContactService } from '../../services/contact.service';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css'
})
export class ContactoComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private contactService = inject(ContactService);
  private animationService = inject(AnimationService);

  contactForm!: FormGroup;
  isSubmitting: boolean = false;
  isSubmitted: boolean = false;
  selectedFAQCategory: string = 'acceso';
  
  // Para trackear qué FAQs están expandidas
  expandedFAQs: Set<string> = new Set();

  // Información de contacto - ahora viene del servicio
  contactInfo: ContactInfo = this.contactService.getContactInfo();

  // Preguntas frecuentes
  faqs: FAQ[] = [
    {
      pregunta: '¿Cómo puedo acceder a las capacitaciones?',
      respuesta: 'Para acceder a las capacitaciones, necesitas registrarte en nuestra plataforma y adquirir uno de nuestros planes. Una vez registrado, tendrás acceso a todo el contenido según el plan que hayas elegido.',
      categoria: 'acceso',
      expanded: false
    },
    {
      pregunta: '¿Qué incluye el Plan Premium?',
      respuesta: 'El Plan Premium incluye acceso ilimitado a todas las capacitaciones, mixs exclusivos, descargas sin límite, soporte prioritario y acceso anticipado a nuevo contenido.',
      categoria: 'planes',
      expanded: false
    },
    {
      pregunta: '¿Puedo cancelar mi suscripción en cualquier momento?',
      respuesta: 'Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. La cancelación será efectiva al final del período de facturación actual.',
      categoria: 'planes',
      expanded: false
    },
    {
      pregunta: '¿Los instructores están certificados?',
      respuesta: 'Todos nuestros instructores son profesionales certificados con amplia experiencia en sus disciplinas. Cada instructor tiene años de experiencia tanto en competencia como en enseñanza.',
      categoria: 'instructores',
      expanded: false
    },
    {
      pregunta: '¿Necesito equipamiento especial?',
      respuesta: 'El equipamiento varía según la disciplina. Para boxeo necesitarás guantes y vendas, para Muay Thai también espinilleras. Proporcionamos una lista detallada de equipamiento recomendado para cada curso.',
      categoria: 'equipamiento',
      expanded: false
    },
    {
      pregunta: '¿Hay contenido para principiantes?',
      respuesta: 'Absolutamente. Tenemos contenido diseñado específicamente para principiantes, con progresiones graduales y explicaciones detalladas de cada técnica.',
      categoria: 'niveles',
      expanded: false
    },
    {
      pregunta: '¿Cómo descargo los mixs de entrenamiento?',
      respuesta: 'Los mixs se pueden descargar directamente desde la sección de Mixs. Solo haz clic en el botón de descarga junto al mix que desees. Nota: la descarga está disponible solo para suscriptores premium.',
      categoria: 'tecnico',
      expanded: false
    },
    {
      pregunta: '¿Puedo acceder desde múltiples dispositivos?',
      respuesta: 'Sí, puedes acceder a tu cuenta desde cualquier dispositivo. Tu progreso se sincroniza automáticamente en todos tus dispositivos.',
      categoria: 'tecnico',
      expanded: false
    },
    {
      pregunta: '¿Ofrecen certificados al completar los cursos?',
      respuesta: 'Sí, al completar satisfactoriamente un curso, recibirás un certificado digital que puedes descargar e imprimir.',
      categoria: 'certificados',
      expanded: false
    },
    {
      pregunta: '¿Hay alguna garantía de devolución?',
      respuesta: 'Ofrecemos una garantía de devolución de 7 días. Si no estás satisfecho con nuestro contenido, puedes solicitar un reembolso completo dentro de los primeros 7 días.',
      categoria: 'planes',
      expanded: false
    }
  ];

  // Categorías de FAQs
  faqCategories = [    
    { key: 'acceso', label: 'Acceso y Registro', icon: 'fas fa-sign-in-alt' },
    { key: 'planes', label: 'Planes y Pagos', icon: 'fas fa-credit-card' },
    { key: 'instructores', label: 'Instructores', icon: 'fas fa-user-tie' },
    { key: 'equipamiento', label: 'Equipamiento', icon: 'fas fa-dumbbell' },
    { key: 'niveles', label: 'Niveles', icon: 'fas fa-layer-group' },
    { key: 'tecnico', label: 'Soporte Técnico', icon: 'fas fa-tools' },
    { key: 'certificados', label: 'Certificados', icon: 'fas fa-certificate' },
    { key: 'todas', label: 'Todas las preguntas', icon: 'fas fa-question-circle' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    
    // Inicializar animaciones
    this.animationService.respectMotionPreference();
    
    setTimeout(() => {
      if (this.animationService.isAnimationSupported()) {
        this.animationService.initScrollAnimations();
        this.animationService.initParallax();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.animationService.cleanup();
  }

  private initializeForm(): void {
    this.contactForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      asunto: ['', [Validators.required, Validators.minLength(5)]],
      mensaje: ['', [Validators.required, Validators.minLength(20)]],
      acepta: [false, [Validators.requiredTrue]]
    });
  }

  // Filtrado de FAQs
  filterFAQs(category: string): void {
    this.selectedFAQCategory = category;
  }

  getFilteredFAQs(): FAQ[] {
    if (this.selectedFAQCategory === 'todas') {
      return this.faqs;
    }
    return this.faqs.filter(faq => faq.categoria === this.selectedFAQCategory);
  }

  getCurrentCategoryInfo() {
    return this.faqCategories.find(cat => cat.key === this.selectedFAQCategory);
  }

  getFAQCountForCategory(category: string): number {
    return this.faqs.filter(faq => faq.categoria === category).length;
  }

  // Envío del formulario
  onSubmit(): void {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = this.contactForm.value;
      
      // Simular envío del formulario
      console.log('Enviando formulario:', formData);
      
      // Simular delay de envío
      setTimeout(() => {
        this.isSubmitting = false;
        this.isSubmitted = true;
        this.contactForm.reset();
        
        // Resetear el estado después de 5 segundos
        setTimeout(() => {
          this.isSubmitted = false;
        }, 5000);
        
      }, 2000);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utilidades del formulario
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${requiredLength} caracteres`;
      }
      if (field.errors['email']) {
        return 'Formato de email inválido';
      }
      if (field.errors['requiredTrue']) {
        return 'Debe aceptar los términos y condiciones';
      }
    }
    
    return '';
  }

  // Acciones de contacto - ahora delegadas al servicio
  callPhone(): void {
    this.contactService.callPhone();
  }

  sendEmail(): void {
    this.contactService.sendEmail();
  }

  openMap(): void {
    this.contactService.openMap();
  }

  openWhatsApp(): void {
    // Número de WhatsApp de WayCombat (puedes cambiarlo por el número real)
    const phoneNumber = '5491127355020'; // Formato internacional sin + ni espacios
    const message = 'Hola! Me interesa obtener asesoría académica sobre los cursos de WayCombat. ¿Podrían ayudarme a elegir el programa adecuado para mi nivel?';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }

  openSocialNetwork(network: keyof ContactInfo['redes']): void {
    this.contactService.openSocialNetwork(network);
  }

  // Utilidades
  toggleFAQ(faq: FAQ): void {
    faq.expanded = !faq.expanded;
  }

  isFAQExpanded(faq: FAQ): boolean {
    return faq.expanded === true;
  }

  getFAQToggleIcon(faq: FAQ): string {
    return faq.expanded ? 'fas fa-minus' : 'fas fa-plus';
  }

  getCharacterCount(fieldName: string): number {
    const field = this.contactForm.get(fieldName);
    return field?.value?.length || 0;
  }

  getCharacterLimit(fieldName: string): number {
    switch(fieldName) {
      case 'asunto':
        return 100;
      case 'mensaje':
        return 1000;
      default:
        return 0;
    }
  }

  isCharacterLimitExceeded(fieldName: string): boolean {
    return this.getCharacterCount(fieldName) > this.getCharacterLimit(fieldName);
  }
}
