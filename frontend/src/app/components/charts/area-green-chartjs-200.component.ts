import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-green-chartjs-200",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-green-chartjs-200"></canvas>`,
})
export class AreaGreenChartjs200Component {
    mygreen200Chart!: Chart;

    ngAfterViewInit() {
        this.green200chart();

        setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    green200chart() {
        const areachartgreen200 = document.getElementById("app-area-green-chartjs-200") as HTMLCanvasElement;
        const ctxgreen200 = areachartgreen200.getContext("2d"); // Get the 2D rendering context
        if (ctxgreen200) {
            this.mygreen200Chart = new Chart(areachartgreen200, {
                type: "bar",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: "rgba(134, 234, 46, 0.5)",
                            borderColor: "rgba(134, 234, 46, 1)",
                            borderWidth: 2,
                            borderRadius: 3,
                            fill: true,
                            tension: 0.45,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            display: true,
                            beginAtZero: true,
                            grid: {
                                display: false,
                            },
                        },
                        x: {
                            display: true,
                            grid: {
                                display: false,
                            },
                        },
                    },
                },
            });
        }
    }
    randomizeChart() {
        if (this.mygreen200Chart) {
            this.mygreen200Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mygreen200Chart.update();
        }
    }
}
