using SU_COIN_BACK_END.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using Pomelo.EntityFrameworkCore.MySql;
using SU_COIN_BACK_END.Services;

namespace SU_COIN_BACK_END.Data
{
    public class DataContext : DbContext 
    {
        public DataContext(DbContextOptions<DataContext> options): base(options){}
        public virtual DbSet <Project> Projects {get; set;}
        public virtual DbSet<User> Users {get; set;}
        public virtual DbSet<ProjectPermission> ProjectPermissions {get; set;}
        public virtual DbSet<Rating> Ratings {get; set;}
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder
                .UseMySql(
                    "server=remotemysql.com;port=3306;user=OZoBcWk8c4;password=A12VxFs2fm;database=OZoBcWk8c4;",
                    new MySqlServerVersion(new Version(8, 0, 11)))
                .UseLoggerFactory(
                    LoggerFactory.Create(b => b
                    .AddConsole()
                    .AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning)))
                .EnableSensitiveDataLogging()
                .EnableDetailedErrors();
        }
    }
}
