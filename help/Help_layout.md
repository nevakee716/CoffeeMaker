| **Name** |  Version | **Updated by** |
| --- | --- | --- |
| **Layout Custom Configuration** | 1.0 | Mathias PFAUWADEL |

## Description 
This layout allow you to configuring different specific that will modify the behaviours of evolve

## Installation
https://github.com/casewise/cpm/wiki

This layout required utils 1.8.
you need to import this with automodeler :
https://github.com/nevakee716/CoffeeMaker/raw/master/automodeler_import.xls

it will a create an indexPage, z_custom_layout_configuration.

## Usage

go on the indexPage z_custom_layout_configuration inside evolve,
<img src="https://github.com/nevakee716/CoffeeMaker/blob/master/screen/config1.png" style="width:95%" />  

configure your customs in this exemple Duplicate Button, click on the tab to select and configure another custom.
You can navigate inside evolve and see it active in your current session

When you finished click on the save icon

<img src="https://github.com/nevakee716/CoffeeMaker/blob/master/screen/config2.png" style="width:95%" />  

The configuration is now save inside your clipboard, copy it inside evolve designer, save & deploy. The configuration will be active for your model and all other users
 
## PlugIns : 

* Action On Object Page : This plugin will allow you to conditionally trigger action (hide, highlight display message) on Object Page (https://github.com/nevakee716/CoffeeMaker/wiki/Action-On-Object-Page)
* Check Edit Model : Check if an object has the right number of associations, some unique property and can fill automatically some property (https://github.com/nevakee716/CoffeeMaker/wiki/Check-Edit-Model)
* Custom Display String Enhanced : This feature modify the custom display string to be more flexible (https://github.com/nevakee716/CoffeeMaker/wiki/Custom-Display-String-Enhanced)
* Duplication Button : This plugin will allow you to duplicate an object directly from evolve, it will copy all the properties, association and association properties of the object Page (https://github.com/nevakee716/CoffeeMaker/wiki/Duplication-Button)
* Home Page : adding option for the home page (https://github.com/nevakee716/CoffeeMaker/wiki/Home-Page)
* Redirect Edit : This feature will allow you to redirect the Evolve users to different views when they enter the edit mode. (https://github.com/nevakee716/CoffeeMaker/wiki/Redirect-Edit)


## Main.js
In order to work in your site, you need to have a main.js inside your deployment node, it can be empty
                                                              