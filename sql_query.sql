-- Highlight and execute this query first, ensure you select Reservation as the database before running other queries
CREATE DATABASE Reservatation
--

CREATE TABLE bookingList
(bookingListId int primary key IDENTITY (1,1) NOT NULL,
firstName varchar(100) not null,
lastName varchar(100) not null,
contactNumber varchar(15) not null,
email varchar(256) not null,
bookingDate date not null,
bookingTime time not null,
specialInstruction varchar(256),
bookingCode varchar(256) not null,
pax int not null,
status varchar(20) not null)


CREATE TABLE admin
(adminId int primary key not null identity(1,1),
name varchar(100) not null,
password varchar(256) not null)

INSERT INTO admin (name, password) VALUES ('admin', '$2b$12$0w1Cmyrrs6TD8/vmRoOwjOgK5wTJ.zW.zBx3raqAH3fiicMRhllAy')

CREATE TABLE [dbo].[sessions](
    [sid] [nvarchar](255) NOT NULL PRIMARY KEY,
    [session] [nvarchar](max) NOT NULL,
    [expires] [datetime] NOT NULL
)


ALTER TABLE sessions
ADD adminId int foreign key references admin(adminId)