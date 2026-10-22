import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const credentials = sessionStorage.getItem('near-market-credentials');
  if (!credentials || !request.url.startsWith(`${environment.apiUrl}/api/`)) return next(request);

  return next(request.clone({
    setHeaders: { Authorization: `Basic ${credentials}` }
  }));
};