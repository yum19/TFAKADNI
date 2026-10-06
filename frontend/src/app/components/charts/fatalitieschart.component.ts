import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-fatality-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="fatality"></canvas>`,
})
export class FatalityChartComponent {
    myinventoryBannerChartChart!: Chart;

    ngAfterViewInit() {
        this.inventoryBannerChartchart();
    }

    /* chart  */

    inventoryBannerChartchart() {
        const areachartinventoryBannerChart = document.getElementById("fatality") as HTMLCanvasElement;
        const ctxinventoryBannerChart = areachartinventoryBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxinventoryBannerChart) {
            var gradientred1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 230);
            gradientred1.addColorStop(0, "rgba(255, 68, 68, 1)");
            gradientred1.addColorStop(1, "rgba(200, 0, 54, 0.0)");

            this.myinventoryBannerChartChart = new Chart(areachartinventoryBannerChart, {
                type: "line",
                data: {
                    labels: ["USA", "CA", "AU", "IN", "CH", "JN", "UAE"],
                    datasets: [
                        {
                            label: "Fatalities",
                            data: [0.5, 1, 1.15, 0.85, 0.92, 1, 1.2, 1.1, 0.5],
                            radius: 4,
                            backgroundColor: gradientred1,
                            borderColor: "rgba(254, 36, 36, 0.75)",
                            borderWidth: 2,
                            borderRadius: 5,
                            fill: true,
                            tension: 0.0,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 0,
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            stacked: true,
                            display: true,
                            grid: {
                                display: false,
                            },
                            beginAtZero: true,
                        },
                        x: {
                            stacked: true,
                            ticks: {
                                maxTicksLimit: 7,
                            },
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
}
