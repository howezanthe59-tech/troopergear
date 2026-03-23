import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  isSubmitting = false;
  errorMessage = '';
  agreementError = '';
  name = '';
  email = '';
  password = '';
  confirm = '';
  agreeToPolicies = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordValid = false;
  confirmValid = false;
  passwordStatus: 'STRONG' | 'STRONG-WEAK' | '' = '';
  confirmStatus: 'MATCH' | 'NO-MATCH' | '' = '';

  constructor(private authService: AuthService, private router: Router) {}

  updatePasswordStatus(password: string) {
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const longEnough = password.length >= 8;
    this.passwordValid = hasLetter && hasNumber && hasSymbol && longEnough;
    this.passwordStatus = this.passwordValid ? 'STRONG' : 'STRONG-WEAK';
  }

  updateConfirmStatus(password: string, confirm: string) {
    if (!confirm) {
      this.confirmStatus = '';
      this.confirmValid = false;
      return;
    }
    this.confirmValid = password === confirm;
    this.confirmStatus = this.confirmValid ? 'MATCH' : 'NO-MATCH';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit() {
    this.agreementError = '';
    if (!this.agreeToPolicies) {
      this.agreementError = 'You must agree to the Privacy Policy and Terms to continue';
      return;
    }
    this.updatePasswordStatus(this.password || '');
    this.updateConfirmStatus(this.password || '', this.confirm || '');
    if (!this.passwordValid || !this.confirmValid) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.register(this.name, this.email, this.password, true).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/profile']);
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Registration failed. Please try a different email.';
      }
    });
  }
}
