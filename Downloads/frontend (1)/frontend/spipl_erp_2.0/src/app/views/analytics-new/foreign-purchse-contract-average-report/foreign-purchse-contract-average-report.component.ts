import { Component, OnInit, ViewEncapsulation, ViewChild, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToasterConfig, ToasterService } from 'angular2-toaster';
import { PermissionService } from '../../../shared/pemission-services/pemission-service';
import { ModalDirective } from "ngx-bootstrap";
import { Table } from "primeng/table";
import { CrudServices } from "../../../shared/crud-services/crud-services";
import { supplierQuantity, ReportRemark } from '../../../shared/apis-path/apis-path';
import { roundQuantity, staticValues } from '../../../shared/common-service/common-service';
import { UserDetails } from '../../login/UserDetails.model';
import { LoginService } from '../../login/login.service';
import { ExportService } from '../../../shared/export-service/export-service';
import { MessagingService } from '../../../service/messaging.service';
import * as moment from "moment";

@Component({
  selector: 'app-foreign-purchse-contract-average-report',
  templateUrl: './foreign-purchse-contract-average-report.component.html',
  styleUrls: ['./foreign-purchse-contract-average-report.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [CrudServices, ToasterService, PermissionService, ExportService]
})

export class ForeignPurchseContractAverageReportComponent implements OnInit {

  @ViewChild("dt", { static: false }) table: Table;

  toasterconfig: ToasterConfig = new ToasterConfig({
    tapToDismiss: true,
    timeout: 5000,
  });

  page_title: any = "Foreign Purchase Contract Average Report";
  user: UserDetails;
  links: string[] = [];
  company_id: any = null;
  role_id: any = null;
  add_opt: boolean = false;
  edit_opt: boolean = false;
  view_opt: boolean = false;
  del_opt: boolean = false;
  isLoading: boolean = false;
  drop_down: boolean = false;
  maxDate: any = new Date();
  datePickerConfig: any = staticValues.datePickerConfigNew;
  // datePickerConfig: any = staticValues.monthYearPickerconfig
  datePickerConfig1: any = staticValues.datePickerConfig
  reports_name: any = staticValues.reports_name;
  remarkForm: any = FormGroup;
  selected_date_range: any = [
    new Date(moment().startOf('month').format("YYYY-MM-DD")),
    new Date(moment().format("YYYY-MM-DD"))
  ];

  currentDate: any = new Date();

  cols: any = [];
  data: any = [];
  misData: any = [];
  filter: any = [];
  dateRange: any = [{ "id": 1, "name": 'DateRangewise' }, { "id": 2, "name": 'MonthWise' }];
  dateType: any;
  uploadSuccess: EventEmitter<boolean> = new EventEmitter();
	isRange: any;
  totalQty: Number;
  totalAmt: Number;
  totalAvg: Number;



  constructor(
    private toasterService: ToasterService,
    private loginService: LoginService,
    private permissionService: PermissionService,
    private crudServices: CrudServices,
    private exportService: ExportService,
    private messagingService: MessagingService,
  ) {
    this.user = this.loginService.getUserDetails();
    this.company_id = this.user.userDet[0].company_id;
    this.role_id = this.user.userDet[0].role_id;
    this.links = this.user.links;
    const perms = this.permissionService.getPermission();
    this.add_opt = perms[0];
    this.view_opt = perms[1];
    this.edit_opt = perms[2];
    this.del_opt = perms[3];

  }


  ngOnInit() {
    this.getData();
    this.dateType = 1;
  }

  receiveDate(dateValue: any){
		this.isRange = dateValue.range
		this.selected_date_range = dateValue.range;
		
	}
	
	clearDropdown(){		
		if(JSON.stringify(this.isRange) != JSON.stringify(this.selected_date_range))
		this.uploadSuccess.emit(false);
	}

  getData() {

    let condition1 = {
      "from_date": moment(this.selected_date_range[0]).format("YYYY-MM-DD"),
      "to_date": moment(this.selected_date_range[1]).format("YYYY-MM-DD"),
      "type": 1
    }
    let condition2 = {
      "currentDate": moment(this.currentDate).format("YYYY-MM-DD"),
      "type": 2
    };

    let condition = (this.dateType === 1) ? condition1 : condition2;
    this.getCols();
    this.data = [];
    this.isLoading = true;


    this.crudServices.getOne<any>(supplierQuantity.getSupplierWiseQuantity, condition).subscribe(res => {
      this.isLoading = false;
      if (res.code == '100') {
        if (res.data.length > 0) {
          this.data = res.data;
          this.data.forEach(item => {
            item.avg_rate = (item.total_amount && item.total_quantity) ? item.total_amount / item.total_quantity : 0;
          })
          this.pushDropdown(this.data);
          this.footerTotal(this.data);

        } else {
          this.toasterService.pop('error', 'Alert', 'No Data Found..!');
          // No Data Found - Toaster
        }
      }
      this.table.reset();
    });
  }

  onSelect(event, mode) {
  }


  getCols() {
    this.cols = [
      { field: 'supplier_name', header: 'Supplier Name', style: '300px', sort: true, filter: true, dropdown: [], footer: false, total: 0, type: null },
      { field: 'total_quantity', header: 'Total Quantity', style: '200px', sort: true, filter: false, dropdown: [], footer: true, total: 0, type: "Quantity" },
      { field: 'total_amount', header: 'Total Amount', style: '200px', sort: true, filter: false, dropdown: [], footer: true, total: 0, type: "$" },
      { field: 'avg_rate', header: 'Avg. Rate', style: '200px', sort: true, filter: false, dropdown: [], footer: true, total: 0, type: "$" },
    ];
    this.filter = ['sub_org_name'];
    this.pushDropdown(this.data);
    this.footerTotal(this.data);
  }

  pushDropdown(arg) {
    let data = null;
    if (arg) {
      data = arg;
    } else {
      data = this.data;
    }
    let filter_cols = this.cols.filter(col => col.filter == true);
    filter_cols.forEach(element => {
      let unique = data.map(item =>
        item[element.field]
      ).filter((value, index, self) =>
        self.indexOf(value) === index
      );
      let array = [];
      unique.forEach(item => {
        array.push({
          value: item,
          label: item
        });
      });
      element.dropdown = array;

    });
  }


  footerTotal(arg) {
    let data = null;
    if (arg) {
      data = arg;
    } else {
      data = this.data;
    }
    let filter_cols = this.cols.filter(col => col.footer == true);
    filter_cols.forEach(element => {
      if (data.length > 0) {
        let total = data.map(item =>
          item[element.field]
        ).reduce((sum, item) => sum + item);

        if (element.type == "Avg") {
          element.total = total / (data.length)
        } else if (element.type == "Quantity") {
          element.total = roundQuantity(total);
          this.totalQty = null;
          this.totalQty = roundQuantity(total);

        }
        else if (element.type == "$") {
          if (element.field == 'total_amount') {
            element.total = roundQuantity(total);
            this.totalAmt = null;
            this.totalAmt = roundQuantity(total);
          }

        }
        else {
          element.total = total;
        }
      }

    });


    this.totalAvg = Number(this.totalAmt) / Number(this.totalQty);



  }

  customFilter(value, col, data) {
    let res = this.table.filter(value, col, data);
    // this.pushDropdown(this.data);
    this.footerTotal(this.data);
  }

  onFilter(e, dt) {
    this.pushDropdown(dt.filteredValue);
    this.footerTotal(dt.filteredValue);
  }


  onAction(item, type) {

    if (type == 'Download') {
      window.open(item.so_copy, "_blank");
    }

    if (type == 'Download_Invoice') {
      let invoice_arr = JSON.parse(item);
      this.crudServices.downloadMultipleFiles(invoice_arr);
    }
  }

  exportData(type) {
    let final_data = null;
    if (this.table.filteredValue == null) {
      final_data = this.data;
    } else {
      final_data = this.table.filteredValue;
    }
    let fileName = this.page_title;
    // let fileName = this.page_title + ' (' + moment(this.selected_date_range[0]).format('DD-MM-YYYY') + ' - ' + moment(this.selected_date_range[1]).format('DD-MM-YYYY') + ')';
    let exportData = [];
    for (let i = 0; i < final_data.length; i++) {
      let obj = {};
      for (let j = 0; j < this.cols.length; j++) {
        if (this.cols[j]["field"] != "action") {
          if (this.cols[j]["field"] == "quantity") {
            obj[this.cols[j]["header"]] = final_data[i][this.cols[j]["field"]];
          } else {
            obj[this.cols[j]["header"]] = final_data[i][this.cols[j]["field"]];
          }
        }
      }
      exportData.push(obj);
    }
    let foot = {};
    for (let j = 0; j < this.cols.length; j++) {
      if (this.cols[j]["field"] != "action") {
        if (this.cols[j]["field"] == "total_quantity" || this.cols[j]["field"] == "total_amount") {
          foot[this.cols[j]["header"]] = this.cols[j]["total"] + " MT";
        } else if (this.cols[j]["field"] == "avg_rate") {
          foot[this.cols[j]["header"]] = this.totalAvg;
          // this.cols[j]["total"];
        } else {
          foot[this.cols[j]["header"]] = "";
        }
      }
    }
    exportData.push(foot);
    if (type == 'Excel') {
      this.exportService.exportExcel(exportData, fileName);
    } else {
      let exportColumns = this.cols.map(function (col) {
        if (col.field != "action") {
          return { title: col.header, dataKey: col.header }
        }
      });
      this.exportService.exportPdf(exportColumns, exportData, fileName);
    }
  }

  ChooseDateType(e) {
    this.dateType = (e == 1) ? 1 : 2;
    this.getData();
  }


}

