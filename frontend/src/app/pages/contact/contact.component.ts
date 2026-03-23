import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  submitted = false;

  onSubmit() {
    console.log('Form Submitted!', this.formData);
    alert('Thank you for your message! Our team will get back to you within 24 hours.');
    this.submitted = true;
    
    // Reset form for future use if needed
    // this.formData = { firstName: '', ... };
  }
}
