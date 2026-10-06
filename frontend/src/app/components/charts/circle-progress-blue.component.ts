import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { NgCircleProgressModule, CircleProgressOptions } from "ng-circle-progress";

@Component({
    selector: "app-circle-progress-blue",
    standalone: true,
    imports: [NgCircleProgressModule],
    providers: [
        {
            provide: CircleProgressOptions,
        },
    ],
    template: `<circle-progress class="avatar avatar-80" [percent]="65" [space]="-6" [radius]="40" [outerStrokeWidth]="6" [innerStrokeWidth]="6" [outerStrokeColor]="'#0088FF'" [innerStrokeColor]="'rgba(0, 73, 232, 0.15)'" [animation]="true" [showSubtitle]="false" [titleFontSize]="'26px'" [unitsFontSize]="'20px'" [titleColor]="'#0088FF'" [unitsColor]="'#0088FF'" [animationDuration]="300"></circle-progress>`,
})
export class CircleProgressBlueComponent {}
