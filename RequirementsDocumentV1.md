# Requirements Document - current EZWallet

Date: 14/04/2023

Version: V1 - description of EZWallet in CURRENT form (as received by teachers)

 
| Version number | Change |
| ----------------- |:-----------|
| 1.0 | Stakeholders, Context Diagram, Interfaces, stories and Personas |
| 1.1 | Functional/ Non Funtional Requirements |
| 1.2 | Use Cases and Scenarios |
| 1.3 | Diagrams |
| 1.4 | Corrections |

# Contents

- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
	+ [Context Diagram](#context-diagram)
	+ [Interfaces](#interfaces) 
	
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
	+ [Functional Requirements](#functional-requirements)
	+ [Non functional requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
	+ [Use case diagram](#use-case-diagram)
	+ [Use cases](#use-cases)
    	+ [Relevant scenarios](#relevant-scenarios)
- [Glossary](#glossary)
- [System design](#system-design)
- [Deployment diagram](#deployment-diagram)

# Informal description
EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.


# Stakeholders

| Stakeholder name  | Description | 
| ----------------- |:-----------:|
|   StakeHolder1: Owner    |    investor, owns the product     |
|   StakeHolder2: User    |    person interested in charting its expenses      |
|   StakeHolder3: DB Administrator    |    person in charge of managing the DB     |
|   StakeHolder4: Developer   | person in charge of developing the software product  |
|   Stakeholder5: Administrator | a person who has rights to manage users in the application |

# Context Diagram and interfaces

## Context Diagram
![image info](./code/images/context_diagram.png)

## Interfaces
| Actor | Logical Interface | Physical Interface  |
| ------------- |:-------------:| -----:|
|   User     | PC | Graphical User Interface (to be defined) |
|   Administrator | PC | Graphical User Interface (to be defined) |

# Stories and personas
- Persona 1: High income professional, male, married, with no children, 40 yo
	+ Story: He thought that invest into this type of application could be profitable. Every month he checks how the project is going.
- Persona 2: Professional, female, divorced, with children, 40 yo
	+ Story: She needs to monitor her expenses, interested in understanding where her money has been spent.
- Persona 3: Student, worker part-time, male, 22, low income
	+ Story: Off-campus student interested in managing his finances better, since he has a part-time job but monthly expenses.
- Persona 4: Student, female, 22, no income 
	+ Story: Student Offsite, interested in managing the money her family sends her.
- Persona 5: Young professional, female, 30, with very high skills in DB management
	+ Story: Graduated with 110 e Lode at the Politecnico Di Torino, specializing in business information systems, subsequently hired for the management of software data. 
- Persona 6: professional, male, married, with children, 50 yo
	+ Story: Web application field expert, with knowledge about the frontend and backend. Proficient with Javascript and able to develop an application very well.
- Persona 7: professional, female, married, with children, 30 yo
	+ Story: Figure with experience in web application for expense management, proficient in managing a great amount of accounts.

# Functional and non functional requirements

## Functional Requirements

| ID        | Description  |
| ------------- |:-------------:| 
|  F1     | Authorize and Authenticate |
|  F1.1     | Log In |
|  F1.2  | Log Out |
|  F1.3	|	Create Account	|
|  F1.4	|	Get Users	|
|  F1.5	|	Get User By Username	|
|  F2 | Manage Expenses |
|  F2.1 | Manage Categories |
|  F2.1.1| Create Categories |
|  F2.1.2| Get Categories |
|  F2.2 | Manage Transaction |
|  F2.2.1| Create Transaction |
|  F2.2.2| Get Transaction |
|  F2.2.3| Delete Transaction |
|  F2.3 | Manage Labels |
|  F2.3.1| Get Labels |

## Non Functional Requirements

| ID        | Type (efficiency, reliability, ..)           | Description  | Refers to |
| ------------- |:-------------:| :-----:| -----:|
|  NFR1     | Efficiency | Each function less than ½ sec | F1,F2 |
|  NFR2     | Portability | Currency is Euro | F2.2,F2.3 |
|  NFR3     | Usability | Training Time 1 Hour, Average Number of Errors less than 2 | F1,F2 |

# Use case diagram and use cases


## Use case diagram
![image info](./code/images/use_case_diagram.png)

### Use case 1, UC1 (Login/Register)
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> opened the application |
|  Post condition     | <u>User</u> is logged |
|  Nominal Scenario     | <u>User</u>, initially on the page, decides if register for the first time or, if already registered, to login. |
|  Variants     | <u>User</u> is not registered, <u>User</u> is already registered  |
|  Exceptions     | wrong username or password |

##### Scenario 1.1 

| Scenario 1.1 | Login |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is registered and not logged in |
|  Post condition     | <u>User</u> is Logged In and can access his account |
| Step#        | Description  |
|  1     | <u>User</u> enters username and password. |  
|  2     | <u>User</u> confirms the login. |

##### Scenario 1.2

| Scenario 1.2 | Register |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is not registered |
|  Post condition     | <u>User</u> is registered and logged in |
| Step#        | Description  |
|  1     | <u>User</u> clicks "not signed up" link. |  
|  2     | <u>User</u> enters username, e-mail, password and confirm password. |  
|  3     | <u>User</u> clicks "sign up" button. |  
|  4     | System confirm the registration after checking if the user doesn't exists. |
|  5     | <u>User</u> is logged. |  


##### Scenario 1.3

| Scenario 1.3 | Wrong Username/Password |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is not registered or not logged in |
|  Post condition     | <u>User</u> is not registered or not logged in |
| Step#        | Description  |
|  1     | <u>User</u> enters username and password. |  
|  2     | Username or password are wrong. |
|  3     | System asks again the data. |

### Use case 2, UC2 Logout
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is already logged in |
|  Post condition     | <u>User</u> is logged out |
|  Nominal Scenario     | <u>User</u>, initially logged in, decides to logout. |
|  Variants     |  |
|  Exceptions     |  |

##### Scenario 2.1

| Scenario 2.1 | Logout |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is already logged in |
|  Post condition     | <u>User</u> is logged out |
| Step#        | Description  |
|  1     | <u>User</u> clicks the settings icon. |  
|  2     | <u>User</u> clicks the logout button. |  
|  3     | System confirms the logout. |

### Use case 3, UC3 (Get Information)

| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and wants to see all categories/labels/transaction inserted. |
|  Post condition     | <u>User</u> retrieves the information he wants. |
|  Nominal Scenario     | <u>User</u>, initially logged in on the page, wants to find information by clicking on the relative button. |
|  Variants     | <u>User</u> wants to see all categories.<br> <u>User</u> wants to see all labels. <br> <u>User</u> wants to see all transaction.  |
|  Exceptions     |  |

##### Scenario 3.1 

| Scenario 3.1 | Find Categories |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "show categories" button. |
|  Post condition     | All categories are displayed. |
| Step#        | Description  |
|  1     | <u>User</u> clicks the "show categories" button. |
|  2     | System shows all categories to the <u>User</u>. |

##### Scenario 3.2

| Scenario 3.2 | Find Labels |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "show labels" button. |
|  Post condition     |  All labels are displayed. |
| Step#        | Description  |
|  1     | <u>User</u> clicks the "show labels" button. |
|  2     | System shows all labels to the <u>User</u>. |

##### Scenario 3.3

| Scenario 3.3 | Find Transaction |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in. |
|  Post condition     |  All transaction are displayed. |
| Step#        | Description  |
|  1     | System shows automatically all transactions to the <u>User</u>. |

### Use case 4, UC4 (Add Information)

| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and want to Add specific information. |
|  Post condition     | <u>User</u> Adds the information he wants. |
|  Nominal Scenario     | <u>User</u>, initially logged in on the page, wants to Add something by clicking on the relative button. |
|  Variants     | <u>User</u> wants to Add a category.<br> <u>User</u> wants to Add a transaction.  |
|  Exceptions     | Category or Transaction are already present. |

##### Scenario 4.1 
| Scenario 4.1 | Add Category |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "add category" button. |
|  Post condition     | A Category is added successfully. |
| Step#        | Description  |
|  1     | <u>User</u> clicks the "show categories" button. |
|  2     | System shows all categories to the <u>User</u>. |
|  3     | <u>User</u> enters the type and the color of the category that he wants to add. |  
|  4     | <u>User</u> clicks the "add category" button. |

##### Scenario 4.2
| Scenario 4.2 | Add Transaction |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "add transaction" button. |
|  Post condition     | A transaction is added successfully. |
| Step#        | Description  |
|  1     | <u>User</u> enters the transaction that he wants to Add. |  
|  2     | <u>User</u> clicks the "add transaction" button. |
|  3     | System confirms the creation. |

##### Scenario 4.3
| Scenario 4.3 | Failure in Creation of Category |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "add category" button. |
|  Post condition     | Nothing is added. |
| Step#        | Description  |
|  1     | <u>User</u> enters the category  that he wants to add. |  
|  2     | <u>User</u> clicks the "add category" button. |
|  3     | System fails on already existing category. |

##### Scenario 4.4
| Scenario 4.4 | Failure in Creation of Transaction |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "add transaction" button. |
|  Post condition     | Nothing is added. |
| Step#        | Description  |
|  1     | <u>User</u> enters the transaction that he wants to add. |  
|  2     | <u>User</u> clicks the "add transaction" button. |
|  3     | System fails on already existing transaction. |

### Use case 5, UC5 (Delete Information)

| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and want to delete an information. |
|  Post condition     | <u>User</u> deletes the information he wants. |
|  Nominal Scenario     | <u>User</u>, initially logged in on the page, wants to delete something by clicking on the relative button. |
|  Variants     | <u>User</u> wants to delete a transaction. |
|  Exceptions     | Transaction not found. |

##### Scenario 5.1
| Scenario 5.1 | Delete a Transaction |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "delete transaction" button. |
|  Post condition     | Transaction is deleted. |
| Step#        | Description  |
|  1     | <u>User</u> enters the transaction id that he wants to delete. |  
|  2     | <u>User</u> clicks the "delete transaction" button. |
|  3     | System confirms the deletion. |

##### Scenario 5.2
| Scenario 5.2 | Transaction Not Found |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged in and clicked "delete transaction" button. |
|  Post condition     | Transaction is not deleted. |
| Step#        | Description  |
|  1     | <u>User</u> enters the transaction id that he wants to delete. |  
|  2     | <u>User</u> clicks the "delete transaction" button. |
|  3     | System fails on missing transaction. |

### Use case 6, UC6 (Get User Information)
| Actors Involved        | User, Administrator |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged |
|  Post condition     | <u>User</u> views his informations |
|  Nominal Scenario     | <u>User</u>, initially on the page, decides to view his account informations. |
|  Variants     |  |
|  Exceptions     |  |

##### Scenario 6.1 

| Scenario 6.1 | Get User Information |
| ------------- |:-------------:| 
|  Precondition     | <u>User</u> is logged |
|  Post condition     | <u>User</u> views his informations |
| Step#        | Description  |
|  1     | <u>User</u> clicks the button to show his account informations. |  
|  2     | Informations are displayed. |

### Use case 7, UC7 (Get Users Information)
| Actors Involved        | Administrator |
| ------------- |:-------------:| 
|  Precondition     | <u>Administrator</u> is logged |
|  Post condition     | <u>Administrator</u> views informations of the <u>Users</u> |
|  Nominal Scenario     | <u>Administrator</u>, initially on the page, decides to view informations of the <u>Users</u>. |
|  Variants     |  |
|  Exceptions     |  |

##### Scenario 7.1 

| Scenario 7.1 | Get Users |
| ------------- |:-------------:| 
|  Precondition     | <u>Administrator</u> is logged |
|  Post condition     | <u>Administrator</u> views informations of the <u>Users</u> |
| Step#        | Description  |
|  1     | <u>Administrator</u> clicks the button to show informations of the <u>Users</u>. |  
|  2     | Informations are displayed. |

# Glossary

![image info](./code/images/glossary.png)

# System Design
![image info](./code/images/system_design.png)

# Deployment Diagram 
![image info](./code/images/deployment_diagram.png)

# Defect Table

| Defect   |      File      |  Description |
|----------|:-------------:|------:|
| getUsers | users.js | Function should be called by User with Admin Privileges, but no check on these privileges is made. |
| get_labels | controller.js |  |
