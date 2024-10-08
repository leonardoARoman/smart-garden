import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import { getStyle } from '@coreui/utils';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { RowComponent, ColComponent, WidgetStatAComponent, TemplateIdDirective, ThemeDirective, DropdownComponent, ButtonDirective, DropdownToggleDirective, DropdownMenuDirective, DropdownItemDirective, DropdownDividerDirective } from '@coreui/angular';
import {CommonModule} from '@angular/common';
import { DataService } from '../../../data.service';
import { EventMqttService } from '../../../event.mqtt.service';
import { Subscription } from 'rxjs';
import { IMqttMessage } from 'ngx-mqtt';

@Component({
    selector: 'app-widgets-dropdown',
    templateUrl: './widgets-dropdown.component.html',
    styleUrls: ['./widgets-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: true,
    imports: [RowComponent, CommonModule, ColComponent, WidgetStatAComponent, TemplateIdDirective, IconDirective, ThemeDirective, DropdownComponent, ButtonDirective, DropdownToggleDirective, DropdownMenuDirective, DropdownItemDirective, RouterLink, DropdownDividerDirective, ChartjsComponent]
})
export class WidgetsDropdownComponent implements OnInit, AfterContentInit {

  events: any[] = [];

  waterMeterTopic: string = "water";
  weatherTopic: string = "weather";
  sensorTopic: string = "sensor";

  temperature = 80;

  subscription: Subscription = new Subscription;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private readonly eventMqtt: EventMqttService
  ) {}

  isOpen = false;
  isSunny = false;
  isCloudy = false;
  isRaining = false;
  isNight = false;

  data: any[] = [];
  options: any[] = [];
  sensors = [
    'Soil Temperature 1',
    'Soil Humidity 1',
    'Soil Temperature 2',
    'Soil Humidity 2'
  ]
  labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  daytime = [
    '00:00 AM',
    '01:00 AM',
    '02:00 AM',
    '03:00 AM',
    '04:00 AM',
    '05:00 AM',
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
    '09:00 PM',
    '10:00 PM',
    '11:00 PM'
  ];
  weekday = [
    'Monday',
    'Tusday',
    'Wenesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ]
  datasets = [
    [{
      label: 'My First dataset',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: getStyle('--cui-primary'),
      pointHoverBorderColor: getStyle('--cui-primary'),
      data: [65, 59, 84, 84, 51, 55, 40]
    }], [{
      label: 'My Second dataset',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: getStyle('--cui-info'),
      pointHoverBorderColor: getStyle('--cui-info'),
      data: [1, 18, 9, 17, 34, 22, 11]
    }], [{
      label: 'My Third dataset',
      backgroundColor: 'rgba(255,255,255,.2)',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: getStyle('--cui-warning'),
      pointHoverBorderColor: getStyle('--cui-warning'),
      data: [78, 81, 80, 45, 34, 12, 40, 78, 81, 80, 45, 34, 12, 40],
      fill: true
    }], [{
      label: 'My Fourth dataset',
      backgroundColor: 'rgba(255,255,255,.2)',
      borderColor: 'rgba(255,255,255,.55)',
      data: [78, 81, 80, 45, 34, 12, 40, 85, 65, 23, 12, 98, 34, 84, 67, 82],
      barPercentage: 0.7
    }]
  ];
  optionsDefault = {
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        min: 30,
        max: 89,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 1,
        tension: 0.4
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  };

  ngOnInit(): void {
    this.setData();
    this.subscribeToTopic(this.waterMeterTopic);
    this.subscribeToTopic(this.weatherTopic);
    this.subscribeToTopic(this.sensorTopic);
  }

  ngAfterContentInit(): void {
    this.changeDetectorRef.detectChanges();

  }

  setData() {
    // TODO check database to see curent weather
    //{"subtopic":"weather", "data":{"is_day":1, "rain": 0, "cloud_cover": 0}}
    this.isSunny = true;
    this.isCloudy = false;
    this.isRaining = false;
    this.isNight = false;
    // Oninit this graphs have to initialize by looking at the database
    this.data[1] = {
      labels: this.weekday,
      datasets: this.datasets[1]
    };
    this.data[2] = {
      // TODO check what time is it and then slice from that time upto 12 hours ahead
      labels: this.daytime.slice(0, 12),
      datasets: this.datasets[2]
    };
    this.data[3] = {
      labels: this.sensors,
      datasets: this.datasets[3]
    };
    this.setOptions();
  }

  setOptions() {
    for (let idx = 0; idx < 4; idx++) {
      const options = JSON.parse(JSON.stringify(this.optionsDefault));
      switch (idx) {
        case 0: {
          this.options.push(options);
          break;
        }
        case 1: {
          options.scales.y.min = -9;
          options.scales.y.max = 39;
          options.elements.line.tension = 0;
          this.options.push(options);
          break;
        }
        case 2: {
          options.scales.x = { display: false };
          options.scales.y = { display: false };
          options.elements.line.borderWidth = 2;
          options.elements.point.radius = 0;
          this.options.push(options);
          break;
        }
        case 3: {
          options.scales.x.grid = { display: false, drawTicks: false };
          options.scales.x.grid = { display: false, drawTicks: false, drawBorder: false };
          options.scales.y.min = undefined;
          options.scales.y.max = undefined;
          options.elements = {};
          this.options.push(options);
          break;
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
        this.subscription.unsubscribe();
    }
  }

  private subscribeToTopic(topic: string) {
    this.subscription = this.eventMqtt.subscribeToMqttTopic(topic).subscribe((data: IMqttMessage) => {
      console.log("incoming mqtt message: "+data);
      let payload = JSON.parse(data.payload.toString());
      console.log("incoming mqtt payload: "+payload);
      this.events.push(payload);
      this.handleMqttMessage(payload);
    }, (error) => {
      let errorMsg = error;
      console.log("errorMsg: "+errorMsg);
    });
  }

  private handleMqttMessage(payload: any) {
    switch (payload.subtopic) {
      case "weather":
        this.handleWeatherTopic(payload.data);
      break;
      case "sunlight":
        this.handleSunlightTopic(payload.data);
      break;
      case "temperature":
        this.handleTemperatureTopic(payload.data);
      break;
      case "humidity":
        this.handleHumidityTopic(payload.data);
      break;
      case "water":
        this.handleWaterTopic(payload.data);
      break;
      case "soilmonitor":
        this.handleSoilmonitorTopic(payload.data);
      break;
    }
  }

  private handleWeatherTopic(data: any) {
    if (data.cloud_cover < 10 && data.rain == 0 && data.is_day == 1) {
      this.isSunny = true;
      this.isCloudy = false;
      this.isRaining = false;
      this.isNight = false;
    } else if (data.rain > 0) {
      this.isSunny = false;
      this.isCloudy = false;
      this.isRaining = true;
      this.isNight = false;
    } else {
      if (data.is_day == 0) {
        this.isSunny = false;
        this.isCloudy = false;
        this.isRaining = false;
        this.isNight = true;
      } else {
        this.isSunny = false;
        this.isCloudy = true;
        this.isRaining = false;
        this.isNight = false;
      }
    }
  }

  private handleSunlightTopic(message: any) {
    // update datagraph in real time
  }

  private handleTemperatureTopic(message: any) {

  }

  private handleHumidityTopic(message: any) {

  }

  private handleWaterTopic(message: any) {

  }

  private handleSoilmonitorTopic(message: any) {

  }

  openSolenoid() {
    var request = {solenoid: "open"}
    this.isOpen = true;
    // if api returns true allow access, no otherwise
    this.dataService.toggleSolenoid(request).subscribe(response => {
      let data = response;
    }, (error) => {
      let errorMsg = error;
    });
  }

  closeSolenoid() {
    var request = {solenoid: "close"}
    this.isOpen = false;
    // if api returns true allow access, no otherwise
    this.dataService.toggleSolenoid(request).subscribe(response => {
      let data = response;
    }, (error) => {
      let errorMsg = error;
    });
  }
}

@Component({
    selector: 'app-chart-sample',
    template: '<c-chart type="line" [data]="data" [options]="options" width="300" #chart></c-chart>',
    standalone: true,
    imports: [ChartjsComponent]
})
export class ChartSample implements AfterViewInit {

  constructor() {}

  @ViewChild('chart') chartComponent!: ChartjsComponent;

  colors = {
    label: 'My dataset',
    backgroundColor: 'rgba(77,189,116,.2)',
    borderColor: '#4dbd74',
    pointHoverBackgroundColor: '#fff'
  };

  labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  data = {
    labels: this.labels,
    datasets: [{
      data: [65, 59, 84, 84, 51, 55, 40],
      ...this.colors,
      fill: { value: 65 }
    }]
  };

  options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    elements: {
      line: {
        tension: 0.4
      }
    }
  };

  ngAfterViewInit(): void {
    setTimeout(() => {
      const data = () => {
        return {
          ...this.data,
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [{
            ...this.data.datasets[0],
            data: [42, 88, 42, 66, 77],
            fill: { value: 55 }
          }, { ...this.data.datasets[0], borderColor: '#ffbd47', data: [88, 42, 66, 77, 42] }]
        };
      };
      const newLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
      const newData = [42, 88, 42, 66, 77];
      let { datasets, labels } = { ...this.data };
      // @ts-ignore
      const before = this.chartComponent?.chart?.data.datasets.length;
      console.log('before', before);
      // console.log('datasets, labels', datasets, labels)
      // @ts-ignore
      // this.data = data()
      this.data = {
        ...this.data,
        datasets: [{ ...this.data.datasets[0], data: newData }, {
          ...this.data.datasets[0],
          borderColor: '#ffbd47',
          data: [88, 42, 66, 77, 42]
        }],
        labels: newLabels
      };
      // console.log('datasets, labels', { datasets, labels } = {...this.data})
      // @ts-ignore
      setTimeout(() => {
        const after = this.chartComponent?.chart?.data.datasets.length;
        console.log('after', after);
      });
    }, 5000);
  }
}
