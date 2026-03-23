import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.checkToken());
  public isLoggedIn$: Observable<boolean> = this.loggedIn.asObservable();
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  private checkToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{ token: string; user: { name: string; role?: string } }>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          if (res?.token) {
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('user_name', res.user?.name || 'Trooper Member');
            localStorage.setItem('user_role', res.user?.role || 'user');
            this.loggedIn.next(true);
          }
        })
      );
  }

  register(name: string, email: string, password: string, acceptedPoliciesAndTerms: boolean): Observable<any> {
    return this.http.post<{ token: string; user: { name: string; role?: string } }>(
      `${this.apiUrl}/auth/register`,
      { name, email, password, acceptedPoliciesAndTerms }
    )
      .pipe(
        tap(res => {
          if (res?.token) {
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('user_name', res.user?.name || name);
            localStorage.setItem('user_role', res.user?.role || 'user');
            this.loggedIn.next(true);
          }
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<{ message: string; resetToken?: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { token, password });
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    this.loggedIn.next(false);
  }

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  getUserName(): string | null {
    return localStorage.getItem('user_name');
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }
}
