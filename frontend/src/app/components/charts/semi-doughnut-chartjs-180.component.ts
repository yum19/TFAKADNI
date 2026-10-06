import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-semi-doughnut-chartjs-180",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="semi-doughnut-chartjs-180" class="width-200 height-200 d-inline-flex justify-content-center align-items-center mt--25 position-relative"></canvas>`,
})
export class SemiDoughnutChartjs180Component {
    mysemidoughnut180Chart!: Chart;

    ngAfterViewInit() {
        this.semidoughnut180chart();
    }

    /* chart  */
    semidoughnut180chart() {
        const areachartsemidoughnut180 = document.getElementById("semi-doughnut-chartjs-180") as HTMLCanvasElement;
        const ctxsemidoughnut180 = areachartsemidoughnut180.getContext("2d"); // Get the 2D rendering context
        if (ctxsemidoughnut180) {
            this.mysemidoughnut180Chart = new Chart(areachartsemidoughnut180, {
                type: "doughnut",
                data: {
                    labels: ["Active Cases", "Fatalities", "Recovery", "Total Cases"],
                    datasets: [
                        {
                            label: "",
                            data: [25, 10, 15, 45],
                            backgroundColor: ["#ffc99fff", "#f7b5b5ff", "#adffabff", "#98d4ffff"],
                            borderColor: ["#cc3c26ff", "#ff2e2eff", "#40d73dff", "#41affeff"],
                            borderWidth: 2,
                            borderRadius: 10,
                        },
                    ],
                },
                options: {
                    circumference: 180,
                    rotation: -90,
                    responsive: true,
                    cutout: 85,
                    plugins: {
                        legend: {
                            display: false,
                            position: "top",
                        },
                        title: {
                            display: false,
                            text: "",
                        },
                    },
                },
            });
        }
    }
}
