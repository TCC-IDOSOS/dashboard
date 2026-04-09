import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from '../services/login/login';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const loginService = inject(LoginService);
  const token = loginService.obterToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` 
      }
    });
    
    return next(authReq);
  }

  return next(req);
};