import { Component, OnInit } from '@angular/core';
import { UIStateService } from '../../services/uistate.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {
  isVisible = false;
  currentTab: 'login' | 'register' = 'login';
  isSubmitting = false;
  errorMessage = '';
  loginEmail = '';
  loginPassword = '';
  regName = '';
  regEmail = '';
  regPassword = '';
  regConfirm = '';
  regAgreeToPolicies = false;
  regAgreementError = '';
  resetEmail = '';
  resetToken = '';
  resetPassword = '';
  resetConfirm = '';
  showReset = false;
  resetStep: 'request' | 'confirm' = 'request';
  passwordStatus: 'STRONG' | 'STRONG-WEAK' | '' = '';
  passwordValid = false;
  confirmStatus: 'MATCH' | 'NO-MATCH' | '' = '';
  confirmValid = false;
  showPassword = false;
  showConfirmPassword = false;
  showLoginPassword = false;
  showResetPassword = false;
  showResetConfirmPassword = false;

  constructor(
    private uiService: UIStateService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.uiService.loginModalOpen$.subscribe(open => {
      this.isVisible = open;
    });
    this.uiService.loginModalTab$.subscribe(tab => {
      if (tab) {
        this.currentTab = tab;
        this.showReset = false;
      }
    });
  }

  setTab(tab: 'login' | 'register') {
    this.currentTab = tab;
    this.errorMessage = '';
    this.regAgreementError = '';
    this.showReset = false;
    this.showLoginPassword = false;
    this.showResetPassword = false;
    this.showResetConfirmPassword = false;
  }

  close() {
    this.uiService.toggleLoginModal(false);
    this.showReset = false;
    this.showLoginPassword = false;
    this.showResetPassword = false;
    this.showResetConfirmPassword = false;
  }

  submitLogin() {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        const role = res?.user?.role || this.authService.getUserRole();
        this.router.navigate([role === 'admin' ? '/admin' : '/profile']);
        this.close();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Login failed. Please check your email and password.';
      }
    });
  }

  startReset() {
    this.showReset = true;
    this.resetStep = 'request';
    this.errorMessage = '';
  }

  requestReset() {
    if (!this.resetEmail) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.forgotPassword(this.resetEmail).subscribe({
      next: res => {
        this.isSubmitting = false;
        if (res?.resetToken) {
          this.resetToken = res.resetToken;
        }
        this.resetStep = 'confirm';
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Unable to start reset. Please try again.';
      }
    });
  }

  submitReset() {
    this.updatePasswordStatus(this.resetPassword || '');
    this.updateConfirmStatus(this.resetPassword || '', this.resetConfirm || '');
    if (!this.passwordValid || !this.confirmValid) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.resetPassword(this.resetToken, this.resetPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showReset = false;
        this.currentTab = 'login';
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Reset failed. Check your token and try again.';
      }
    });
  }

  submitRegister() {
    this.regAgreementError = '';
    if (!this.regAgreeToPolicies) {
      this.regAgreementError = 'You must agree to the Privacy Policy and Terms to continue';
      return;
    }
    this.updatePasswordStatus(this.regPassword || '');
    this.updateConfirmStatus(this.regPassword || '', this.regConfirm || '');
    if (!this.passwordValid || !this.confirmValid) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.register(this.regName, this.regEmail, this.regPassword, true).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/profile']);
        this.close();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Registration failed. Please try a different email.';
      }
    });
  }

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

  toggleShowLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleShowResetPassword() {
    this.showResetPassword = !this.showResetPassword;
  }

  toggleShowResetConfirmPassword() {
    this.showResetConfirmPassword = !this.showResetConfirmPassword;
  }

  signInAsGuest() {
    // Guest users can browse the storefront without authentication.
    this.errorMessage = '';
    this.close();
    this.router.navigate(['/products']);
  }
}
