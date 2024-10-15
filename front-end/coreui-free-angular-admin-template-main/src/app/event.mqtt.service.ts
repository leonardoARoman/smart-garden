import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventMqttService {

  constructor(private _mqttService: MqttService) { }

  subscribeToMqttTopic(topic: string): Observable<IMqttMessage> {
    return this._mqttService.observe(topic);
  }
}
