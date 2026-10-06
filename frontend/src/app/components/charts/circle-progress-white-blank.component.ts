import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { NgCircleProgressModule, CircleProgressOptions } from "ng-circle-progress";

@Component({
    selector: "app-circle-progress-white-blank",
    standalone: true,
    imports: [NgCircleProgressModule],
    providers: [
        {
            provide: CircleProgressOptions,
        },
    ],
    template: `<circle-progress class="avatar avatar-60" [percent]="65" [space]="-4" [radius]="30" [outerStrokeWidth]="4" [innerStrokeWidth]="4" [outerStrokeColor]="'#ffffff'" [innerStrokeColor]="'rgba(255, 255, 255, 0.25)'" [animation]="true" [showSubtitle]="false" [showTitle]="false" [showUnits]="false" [animationDuration]="300"></circle-progress>`,
})
export class CircleProgressWhiteBlankComponent {}
