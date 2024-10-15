import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  nodered = 'http://10.0.0.8:1880'; 

  constructor(private http: HttpClient) { }

  // toggle route for ESP8266 toggle API
  toggleSolenoid(request : any): Observable<any> {
    return this.http.post(this.nodered+`/toggle`, request);
  }
}
