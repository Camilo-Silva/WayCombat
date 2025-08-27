import { Injectable } from '@angular/core';
import { ContactInfo } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  
  // FUENTE ÚNICA DE VERDAD - Solo aquí se definen los datos de contacto
  private readonly contactData: ContactInfo = {
    direccion: 'Av. Corrientes 1234, CABA, Buenos Aires, Argentina',
    telefono: '+54 11 4567-8900',
    email: 'info@waycombat.com',
    horarios: 'Lunes a Viernes: 9:00 - 21:00\nSábados: 9:00 - 18:00\nDomingos: 10:00 - 16:00',
    redes: {
      facebook: 'https://facebook.com/way.combat.2025',
      instagram: 'https://instagram.com/waycombat_w.c',
      tiktok: 'https://www.tiktok.com/@way_combat',
      youtube: 'https://youtube.com/waycombat'
    }
  };

  /**
   * Obtiene toda la información de contacto
   */
  getContactInfo(): ContactInfo {
    return { ...this.contactData }; // Retorna una copia para evitar mutaciones
  }

  /**
   * Obtiene solo las URLs de redes sociales
   */
  getSocialNetworks() {
    return { ...this.contactData.redes };
  }

  /**
   * Abre una red social específica
   */
  openSocialNetwork(network: keyof ContactInfo['redes']): void {
    const url = this.contactData.redes[network];
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Realiza una llamada telefónica
   */
  callPhone(): void {
    window.location.href = `tel:${this.contactData.telefono}`;
  }

  /**
   * Abre el cliente de email
   */
  sendEmail(): void {
    window.location.href = `mailto:${this.contactData.email}`;
  }

  /**
   * Abre Google Maps con la dirección
   */
  openMap(): void {
    const address = encodeURIComponent(this.contactData.direccion);
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  }
}
