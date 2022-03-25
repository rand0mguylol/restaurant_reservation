# Usage

### Microsoft SQL Server Management Studio

1. Ensure you have Microsoft SQL Server Management Studio installed on your machine.
2. Execute the queries in the query file provided

### Setting Up TCP Port

1. Search for **Computer Management** in the search bar and open it.
2. Go to **Services and Applications** -> **SQL Server Configuration Manager** -> **SQL Server Network Configuration** -> **Protocols for SQLEXPRESS**![Image 1](https://user-images.githubusercontent.com/72346097/160035523-ccb2c01c-5062-4e48-82e5-fb4ab42448fb.png)

3. Ensure **TCP/IP** is enabled. 
4. Right click it and go to **Properties**
5. Ensure **TCP Port** is set to **1433**![Image 3](https://user-images.githubusercontent.com/72346097/160035552-155fde56-3a43-4320-9715-352b9ac9388f.jpg)


### Creating a database user

If you would to select SQL Authentication as your authentication option, ensure you have a database user account that can access the database.

1. Right click **Logins** and select **New Logins**![Screenshot (597)_LI](https://user-images.githubusercontent.com/72346097/160037868-2dc6e9b1-0aeb-4238-ae9e-0b13d3d5bb58.jpg)
2. Select SQL Server Authenticatin. Fill in fields for **Login Name**, **Password** and **Confirm Password**. For a quick and hassle free demo, uncheck **Enfore password policy** (**Not Recommended**). Select **Reservation** or the name that you gave to the database as the **Default Database**![Screenshot (601)_LI](https://user-images.githubusercontent.com/72346097/160038183-c4735657-7e09-471c-a21e-f2b4c9ad7bbf.jpg)
3. Go to **User Mapping**, check the database and  **db_owner**![Screenshot (602)_LI](https://user-images.githubusercontent.com/72346097/160038296-cba89ee9-1742-4f0e-a20e-192ffb4d4cde.jpg)
4. Right click the server and go to **Properties**![Screenshot (603)_LI](https://user-images.githubusercontent.com/72346097/160038336-c3409fe9-c5e3-43d4-8cfc-027f199697c6.jpg)
5. Ensure SQL Server and Windows Authentication mode is selected![Screenshot (604)_LI](https://user-images.githubusercontent.com/72346097/160038387-8c0f26aa-76d8-4319-9409-95f7178f54b2.jpg)


### Running the application

1. Ensure node has been installed on your machine.
2. Run *npm i* to install the dependencies
3. Create an `.env` file.
4. Fill in the details. Insert anything for SECRET ![Screenshot (608)](https://user-images.githubusercontent.com/72346097/160038904-4c2415e9-36c7-4195-a1f1-a8852f85dbca.png)







