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
