import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isSubmitting = false;
  errorMessage = '';
  email = '';
  password = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  submit() {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        const role = res?.user?.role || this.authService.getUserRole();
        this.router.navigate([role === 'admin' ? '/admin' : '/profile']);
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Login failed. Please check your email and password.';
      }
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}
