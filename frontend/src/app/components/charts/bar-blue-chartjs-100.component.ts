import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-bar-blue-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="bar-blue-chartjs-100"></canvas>`,
})
export class BarBlueChartjs100Component {
    mybar100Chart!: Chart;

    ngAfterViewInit() {
        this.bar100chart();

        setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    bar100chart() {
        const areachartbar100 = document.getElementById("bar-blue-chartjs-100") as HTMLCanvasElement;
        const ctxbar100 = areachartbar100.getContext("2d"); // Get the 2D rendering context
        if (ctxbar100) {
            this.mybar100Chart = new Chart(areachartbar100, {
                type: "bar",
                data: {
                    labels: ["1", "2", "3", "4", "5", "6", "7", "8"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "rgba(0, 136, 255, 0.35)",
                            borderWidth: 0,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 8,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "rgba(0, 136, 255, 1)",
                            borderWidth: 0,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 8,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: -10,
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            display: false,
                            beginAtZero: true,
                        },
                        x: {
                            display: false,
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
        if (this.mybar100Chart) {
            this.mybar100Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mybar100Chart.update();
        }
    }
}
