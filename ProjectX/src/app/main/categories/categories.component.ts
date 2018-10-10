import { PopupData } from './../popup/popup.data';
import { config } from './../../../services/config';
import { User } from './../../../models/user.model';
import { Income } from './../../../models/income.model';
import { Expense } from './../../../models/expense.model';
import { DBService } from './../../../services/db.service';
import {
    Component,
    OnInit,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ElementRef
} from '@angular/core';
@Component({
    selector: 'app-categories',
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnChanges {
    //
    @ViewChild('expInput')
    expInput: ElementRef;
    @ViewChild('incInput')
    incInput: ElementRef;

    user: User;
    expenses: Expense[];
    incomes: Income[];

    @Input()
    set userData(value) {
        this.user = value;
    }
    @Input()
    set userExpenses(value) {
        this.expenses = value;
    }
    @Input()
    set userIncomes(value) {
        this.incomes = value;
    }
    // values to display from this array for expsense categories
    expCategoryValuePairs = [];
    // values to display from this array for income categories
    incCategoryValuePairs = [];

    expInputShow = false;
    expBtnFinish = false;

    incInputShow = false;
    incBtnFinish = false;

    popupData: PopupData;
    showPopup = false;

    constructor(private db: DBService) {}

    PopupEventTriggered(data) {
        this.showPopup = data;
    }
    clearInputFields() {
        this.expInput.nativeElement.value = null;
        this.incInput.nativeElement.value = null;
    }

    // get total money spent by Category
    totalExpByCat() {
        this.expCategoryValuePairs = [];
        // temporary array with all categories
        const tmpCatArr: string[] = this.user.getCategoriesExp();
        // loop through all categories
        if (tmpCatArr) {
            tmpCatArr.forEach(cat => {
                let catVal = 0;
                // loop through all expenses
                this.expenses.forEach(exp => {
                    // compare category values from tmpCatArr and expense array
                    if (cat === exp.getCategory()) {
                        // if true add all expense values(converted to positives) for current category
                        catVal += Math.abs(exp.getValue());
                    }
                });
                this.expCategoryValuePairs.push([cat, catVal]);
            });
        }
    }

    // get total money gained by Category
    totalIncByCat() {
        this.incCategoryValuePairs = [];
        // temporary array with all categories
        const tmpCatArr: string[] = this.user.getCategoriesInc();
        if (tmpCatArr) {
            // loop through all categories
            tmpCatArr.forEach(cat => {
                let catVal = 0;
                // loop through all expenses
                this.incomes.forEach(inc => {
                    // compare category values from tmpCatArr and expense array
                    if (cat === inc.getCategory()) {
                        // if true add all expense values(converted to positives) for current category
                        catVal += inc.getValue();
                    }
                });
                this.incCategoryValuePairs.push([cat, catVal]);
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.totalExpByCat();
        this.totalIncByCat();
    }

    ngOnInit() {}

    onAdd(value: string, type: string) {
        console.log(this.user);
        if (value) {
            if (this.user) {
                if (type === 'expense') {
                    if (this.user.getCategoriesExp()) {
                        this.user
                            .getCategoriesExp()
                            .push(
                                value[0].toUpperCase() +
                                    value.slice(1).toLowerCase()
                            );
                    } else {
                        this.user.setCategoriesExp([]);
                        this.user
                            .getCategoriesExp()
                            .push(
                                value[0].toUpperCase() +
                                    value.slice(1).toLowerCase()
                            );
                    }
                } else if (type === 'income') {
                    if (this.user.getCategoriesInc()) {
                        this.user
                            .getCategoriesInc()
                            .push(
                                value[0].toUpperCase() +
                                    value.slice(1).toLowerCase()
                            );
                    } else {
                        this.user.setCategoriesExp([]);
                         this.user
                            .getCategoriesInc()
                            .push(
                                value[0].toUpperCase() +
                                    value.slice(1).toLowerCase()
                            );
                            }
                }
                this.db.updateItem<User>(
                    config.users_endpoint,
                    this.user.getId(),
                    this.user
                );
            }
        } else if ((this.expInputShow || this.expBtnFinish) && !value) {
            this.popupData = new PopupData(
                'Value missing',
                'Please specify category name!'
            );
            this.showPopup = true;
        }
        if (type === 'expense') {
            this.expInputShow = true;
            this.expBtnFinish = true;
        } else if (type === 'income') {
            this.incInputShow = true;
            this.incBtnFinish = true;
        }
        this.clearInputFields();
    }

    onFinish(type: string) {
        if (type === 'expense') {
            this.expInputShow = false;
            this.expBtnFinish = false;
        }
        if (type === 'income') {
            this.incInputShow = false;
            this.incBtnFinish = false;
        }

        this.db.updateItem<User>(
            config.users_endpoint,
            this.user.getId(),
            this.user
        );
        this.clearInputFields();
    }

    onRemove(cat: any, type: string) {
        // ovo moze mnoooooogo bolje, al sam lenj
        if (type === 'expense') {
            this.user
                .getCategoriesExp()
                .splice(this.user.getCategoriesExp().indexOf(cat), 1);
        } else if (type === 'income') {
            this.user
                .getCategoriesInc()
                .splice(this.user.getCategoriesInc().indexOf(cat), 1);
        }
        this.db.updateItem<User>(
            config.users_endpoint,
            this.user.getId(),
            this.user
        );
    }
}
