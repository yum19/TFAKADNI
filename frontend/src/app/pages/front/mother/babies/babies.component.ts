import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
 

@Component({
  selector: "app-babies",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: "./babies.component.html",
  styleUrls: ["./babies.component.css"],
})
export class BabiesComponent implements OnInit {
  ngOnInit(): void {}
}