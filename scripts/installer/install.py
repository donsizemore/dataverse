#!/usr/bin/python

from ConfigParser import SafeConfigParser
import os.path
from os import fdopen
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import re
from shutil import copy2, move
import subprocess # for java / asadmin commands
import sys
from tempfile import mkstemp
import xml.etree.cElementTree as ET

# ----- configuration ----- #

# read pre-defined defaults
default_config = "default.config"
config = SafeConfigParser()
config.read(default_config)

# read database credentials
pg_admin = config.get('database', 'POSTGRES_ADMIN_PASSWORD')
pg_db = config.get('database', 'POSTGRES_DATABASE')
pg_host = config.get('database', 'POSTGRES_SERVER')
pg_pass = config.get('database', 'POSTGRES_PASSWORD')
pg_user = config.get('database', 'POSTGRES_USER')

# read glassfish settings 
glassfish_dir = config.get('glassfish', 'GLASSFISH_DIRECTORY')
glassfish_config = glassfish_dir+"/glassfish/domains/domain1/config/domain.xml"
glassfish_domain = "domain1"
glassfish_heap = config.get('glassfish', 'GLASSFISH_HEAP')
glassfish_jarpath = glassfish_dir+"/glassfish/modules"
glassfish_user = config.get('glassfish', 'GLASSFISH_USER')
glassfish_adminuser = config.get('glassfish', 'GLASSFISH_ADMIN_USER')
glassfish_adminpass = config.get('glassfish', 'GLASSFISH_ADMIN_PASSWORD')

# expected dataverse defaults
api_url = "http://localhost:8080/api"

# command-line arguments override default.config values

# enumerate postgres drivers
postgres_drivers = dict()
postgres_drivers["804"] = "postgresql-8.4-703.jdbc4.jar"
postgres_drivers["900"] = "postgresql-9.0-802.jdbc4.jar"
postgres_drivers["901"] = "postgresql-9.1-902.jdbc4.jar"
postgres_drivers["902"] = "postgresql-9.1-902.jdbc4.jar"
postgres_drivers["903"] = "postgresql-9.1-902.jdbc4.jar"
postgres_drivers["904"] = "postgresql-9.1-902.jdbc4.jar"
postgres_drivers["905"] = "postgresql-9.1-902.jdbc4.jar"
postgres_drivers["906"] = "postgresql-9.1-902.jdbc4.jar"

# ----- a few useful functions ----- #

# for editing lines in domain.xml
def replaceLine(file, pattern, subst):
   fh, tempfile = mkstemp()
   with fdopen(fh,'w') as new_file:
      with open(file) as orig_file:
         print file
         for line in orig_file:
            new_file.write(line.replace(pattern, subst))
   backup = file+".bak"
   copy2(file, backup)
   move(tempfile, file)

# determine free system memory (Linux for now)
def linuxRAM():
        totalMemory = os.popen("free -m").readlines()[1].split()[1]
        return int(totalMemory)

# ----- pre-flight ----- #

# check to see if warfile is available
warfile = "dataverse.war"
if not os.path.isfile(warfile):
   # get dataverse version from pom.xml
   tree = ET.ElementTree(file='../../pom.xml')
   for elem in tree.iter("*"):
      if elem.tag == '{http://maven.apache.org/POM/4.0.0}version':
         version = elem.text
         # only want the first, the rest are dependencies
         break
   # now check for version-ed warfile, or bail
   warfile = '../../target/dataverse-' + version + '.war'
   if not os.path.isfile(warfile):
      sys.exit("Sorry, I can't seem to find an appropriate warfile.\nAre you running the installer from the right directory?")
print warfile+" available to deploy. Good."

# check for reference-data.sql
if not os.path.isfile('../database/reference_data.sql'):
   sys.exit("WARNING: Can't find .sql data template!\nAre you running the installer from the right directory?")

# check for existence of jq
try:
   subprocess.call(["jq", "--version"])
except:
   print "Can't find the jq utility in my path. Is it installed?"

# can we connect as the postgres admin user?
admin_conn_string = "dbname='postgres' user='postgres' password='"+pg_admin+"' host='"+pg_host+"'"

try:
   conn = psycopg2.connect(admin_conn_string)
   print "Admin database connectivity succeeds."
except:
   print "Can't connect to PostgresQL as the admin user.\n"
   sys.exit("Is the server running, have you adjusted pg_hba.conf, etc?")

# get the Postgres version for driver jar below
try:
   pg_full_version = conn.server_version
   print "PostgresQL version: "+str(pg_full_version)
except:
   print "Couldn't determine PostgresQL version."
conn.close()

# --- create database and role --- #

conn_cmd = "CREATE ROLE "+pg_user+" PASSWORD '"+pg_pass+"' NOSUPERUSER CREATEDB CREATEROLE INHERIT LOGIN;"
conn = psycopg2.connect(admin_conn_string)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()
try:
   cur.execute(conn_cmd)
except:
   print "Looks like the user already exists. Continuing."

conn_cmd = "CREATE DATABASE "+pg_db+" OWNER "+pg_user+";"
try:
   cur.execute(conn_cmd)
except:
   sys.exit("Couldn't create database or database already exists.\n")

conn_cmd = "GRANT ALL PRIVILEGES on DATABASE "+pg_db+" to "+pg_user+";"
try:
   cur.execute(conn_cmd)
except:
   sys.exit("Couldn't grant privileges on "+pg_db+" to "+pg_user)
cur.close()
conn.close()

print "Database and role created!"

# ----- Glassfish setup ----- #

# let's make the heap 1/2 of system memory
totalRAM = linuxRAM()
gf_heap = int( totalRAM / 2)
gf_xmx = "Xmx"+str(gf_heap)

try:
   replaceLine(glassfish_config, "Xmx512", gf_xmx)
   print "Setting JVM heap to "+str(gf_heap)+". You may want to increase this to suit your system."
except:
   print "Unable to adjust JVM heap size. Please check file permissions, etc?"

# only want PostgresQL major/minor; pick appropriate driver
pg_version = str(pg_full_version)[:3]
pg_driver_jar = postgres_drivers[pg_version]
pg_driver_jarpath = "pgdriver/"+pg_driver_jar

try:
   copy2(pg_driver_jarpath, glassfish_jarpath)
   print "Copied "+pg_driver_jar+" into "+glassfish_jarpath
except:
   print "Couldn't copy "+pg_driver_jar+" into "+glassfish_jarpath+". Check its permissions?"

# ----- asadmin configuration ----- #

print "Note: some asadmin commands will fail. Existing settings can't be created; new settings can't be cleared beforehand."

# check java version
java_version = subprocess.check_output(["java", "-version"], stderr=subprocess.STDOUT)
print "Found java version "+java_version
if not re.search("1.8", java_version):
   sys.exit("Dataverse requires Java 1.8. Please install it and try again")

# check if glassfish is running, attempt to start if necessary
asadmincmd = glassfish_dir +"/bin/asadmin"
domain_status = subprocess.check_output([asadmincmd, "list-domains"], stderr=subprocess.STDOUT)
if re.match(glassfish_domain+" not running", domain_status):
   print "Looks like Glassfish isn't running. Attempting to start it..."
   subprocess.call([asadmincmd, "start-domain"], stderr=subprocess.STDOUT)
   # now check again or bail
   print "Checking to be sure "+glassfish_domain+" is running."
   domain_status = subprocess.check_output([asadmincmd, "list-domains"], stderr=subprocess.STDOUT)
   if not re.match(glassfish_domain+" running", domain_status):
      sys.exit("There was a problem starting Glassfish. Please ensure that it's running, or that the installer can launch it.")

# create glassfish admin credentials file

gfclientdir = "/home/"+glassfish_user+"/.gfclient"
gfclientfile = glassfish_dir+"/pass"

# mkdir gfclientdir
try:
   os.mkdir([gfclientdir,0700])
except:
   print "Couldn't create "+gfclientdir+", please check permissions."

# write credentials
credstring = "asadmin://"+glassfish_adminuser+"@localhost:4848"

f = open(gfclientfile, 'w')
try:
   f.write(credstring)
   print "Glassfish admin credentials written to "+gfclientfile+"."
except:
   print "Unable to write Glassfish admin credentials. Subsequent commands will likely fail."
f.close

#gf_adminpass_status = subprocess.check-output([asadmincmd, "login", "--user="+gf_adminuser, "--passwordfile "+gfpwdfile])
