import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api.models';

export function unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
  return source.pipe(map(response => response.data));
}
