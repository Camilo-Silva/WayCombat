import { Injectable } from '@angular/core';
import { ContactInfo } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  // FUENTE ÚNICA DE VERDAD - Solo aquí se definen los datos de contacto
  private readonly contactData: ContactInfo = {
    direccion: 'Balboa 6728, Gonzalez Catan, Buenos Aires, Argentina',
    telefono: '+54 9 1171342320',
    email: 'Federrr8787@gmail.com',
    horarios: 'Lunes a Viernes: 9:00 - 21:00\nSábados: 9:00 - 18:00\nDomingos: 10:00 - 16:00',
    redes: {
      facebook: 'https://facebook.com/way.combat.2025',
      instagram: 'https://www.instagram.com/way_combat?igsh=NXN2c3V3bmt1N3p6',
      tiktok: 'https://www.tiktok.com/@way_combat',
      youtube: 'https://www.youtube.com/@way_combat'
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

  /**
   * Abre WhatsApp con un mensaje predefinido
   */
  openWhatsApp(message?: string): void {
    // Remover el + y espacios del número para el formato wa.me
    const phoneNumber = this.contactData.telefono.replace(/[+\s-]/g, '');
    const defaultMessage = 'Hola! Me interesa obtener información sobre WayCombat.';
    const finalMessage = message || defaultMessage;
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Obtiene el número de WhatsApp en formato wa.me (sin + ni espacios)
   */
  getWhatsAppNumber(): string {
    return this.contactData.telefono.replace(/[+\s-]/g, '');
  }

  /**
   * Obtiene la URL de WhatsApp con mensaje opcional
   */
  getWhatsAppUrl(message?: string): string {
    const phoneNumber = this.getWhatsAppNumber();
    if (message) {
      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }
    return `https://wa.me/${phoneNumber}`;
  }
}
