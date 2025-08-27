import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContactInfo } from '../../../models/contact.model';
import { ContactService } from '../../../services/contact.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  private contactService = inject(ContactService);
  
  currentYear = new Date().getFullYear();
  
  // Información de contacto - ahora viene del servicio centralizado
  contactInfo: ContactInfo = this.contactService.getContactInfo();
}
