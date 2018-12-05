import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Converter } from './../converters/converter';
import { User } from './../models/user.model';
import { UserCredentials } from './../models/userCredentials.model';
import { config } from './../services/config';
import { DBService } from './../services/db.service';
import { LoginService } from './../services/login.service';
import { MainComponent } from './main/main.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public static currency: string;
    @ViewChild('mainComponent') mainComponent: MainComponent;
    currUserData: any;
    currUserCredentials: UserCredentials;
    currUserExpenses: any[] = [];
    currUserIncomes: any[] = [];

    hasBalance = false;
    hasIncomes = false;
    hasExpenses = false;

    constructor(
        public db: DBService,
        translate: TranslateService,
        private loginService: LoginService
    ) {
        translate.setDefaultLang('en');
        translate.use('en');

        // TODO: fix this and see about its implementation
        if (translate.defaultLang === 'en') {
            AppComponent.currency = '$';
        } else {
            AppComponent.currency = 'din';
        }
    }

    reloadUserData(bool) {
        if (bool) {
            this.getUserData(this.currUserCredentials);
            this.mainComponent.mainInputComponent.calculateBalance();
        }
    }

    signOutVal(): boolean {
        if (this.currUserCredentials) {
            return true;
        }
    }

    getUserCred() {
        this.loginService.userCredentials.subscribe(res => {
            if (res) {
                this.currUserCredentials = res;
                this.getUserData(this.currUserCredentials);
            }
        });
    }

    getUserData(cred: UserCredentials) {
        // 1. LOG IN user
        if (cred) {
            // 2. get userData from be
            this.db.getSpecificItem(config.users_endpoint, cred.uid).subscribe(
                // -- userData --
                userData => {
                    // if there is data this meands that the user is not a new user
                    if (userData.payload.data()) {
                        this.currUserData = Converter.jsonToModel(
                            userData.payload.data(),
                            config.users_endpoint
                        );
                        if (this.currUserData.getBalance()) {
                            this.hasBalance = true;
                        }

                        cred.isNew = false;
                        // get all incomes and expenses from user
                        this.db
                            .getAllValues(
                                config.incomes_endpoint,
                                this.currUserData.getId()
                            )
                            .subscribe(
                                incomes => {
                                    this.currUserIncomes = Converter.jsonToModelList(
                                        incomes,
                                        config.incomes_endpoint
                                    );
                                    if (this.currUserIncomes[0]) {
                                        this.hasIncomes = true;
                                    }
                                },
                                err => {
                                    console.error(err);
                                }
                            );
                        this.db
                            .getAllValues(
                                config.expenses_endpoint,
                                this.currUserData.getId()
                            )
                            .subscribe(
                                expenses => {
                                    this.currUserExpenses = Converter.jsonToModelList(
                                        expenses,
                                        config.expenses_endpoint
                                    );
                                    if (this.currUserExpenses[0]) {
                                        this.hasExpenses = true;
                                    }
                                },
                                err => {
                                    console.error(err);
                                }
                            );
                    } else {
                        // no data? so its a new user. we need to create his userData
                        const newUser = new User(cred.uid);
                        this.db.addItem<User>(
                            config.users_endpoint,
                            newUser,
                            newUser.getId()
                        );
                        cred.isNew = true;
                    }
                    // setTimeout(() => {
                    //     this.db.updateItem<User>(
                    //         config.users_endpoint,
                    //         cred.uid,
                    //         this.mockUser(cred.uid)
                    //     );
                    // }, 5000);
                }
            );
        }
    }

    ngOnInit() {
        this.getUserCred();
    }

    mockUser(id: string) {
        const mock = new User(id);
        mock.setBalance(12345);

        return mock;
    }
}
