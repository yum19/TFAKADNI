import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-timeline-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="timeline-chart"></canvas>`,
})
export class TimelineChartComponent {
    myinventoryBannerChartChart!: Chart;

    ngAfterViewInit() {
        this.inventoryBannerChartchart();
    }

    /* chart  */

    inventoryBannerChartchart() {
        const areachartinventoryBannerChart = document.getElementById("timeline-chart") as HTMLCanvasElement;
        const ctxinventoryBannerChart = areachartinventoryBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxinventoryBannerChart) {
            var gradientgreen1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 190);
            gradientgreen1.addColorStop(0, "rgba(71, 223, 132, 1)");
            gradientgreen1.addColorStop(1, "rgba(8, 160, 70, 0.1)");
            var gradientred1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 200);
            gradientred1.addColorStop(0, "rgba(255, 68, 68, 1)");
            gradientred1.addColorStop(1, "rgba(200, 0, 54, 0.0)");
            var gradientyellow1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 140);
            gradientyellow1.addColorStop(0, "rgba(129, 214, 218, 0.5)");
            gradientyellow1.addColorStop(1, "rgba(59, 174, 180, 0.0)");

            this.myinventoryBannerChartChart = new Chart(areachartinventoryBannerChart, {
                type: "bar",
                data: {
                    labels: ["USA", "CA", "AU", "IN", "CH", "JN", "UAE"],
                    datasets: [
                        {
                            label: "Total Cases",
                            data: [5, 5, 4, 6, 5, 4.5, 5, 4, 3],
                            radius: 2,
                            backgroundColor: "rgba(16, 107, 252, 0.75)",
                            borderColor: "transparent",
                            borderWidth: 2,
                            borderRadius: 5,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "Active Cases",
                            data: [1.2, 1.5, 2, 2, 1, 1.5, 1, 2, 2],
                            radius: 2,
                            backgroundColor: "rgba(241, 112, 42, 0.75)",
                            borderColor: "transparent",
                            borderWidth: 2,
                            borderRadius: 5,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "Fatalities",
                            data: [0.5, 1, 1.15, 0.85, 0.92, 1, 1.2, 1.1, 0.5],
                            radius: 2,
                            backgroundColor: "rgba(222, 20, 20, 0.75)",
                            borderColor: "transparent",
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
