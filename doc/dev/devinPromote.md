# Create Project
Create a professional website based the popular frontend framework (vue or React) and python based backend (fastAPI). 

## Frontend

### main page
In the main page, user can select domain(select from database), and input job id(text) to trigger a job analysis, and show the analysis result in 
the following page.   
The analysis result include job failure category(unknown, userInputError, ThirdPlatformError, PlatformError), 
root cause analysis, and user suggestions. 

### create domain page
If in the main page, can not find specific domain, user can create a new domain. 
In the create domain page, there was a large workspace, like regular processor flow 
design website, it can create a flow for how to diagnose the job failure. Basically, it needs three part of content 
to create a new domain. First, the domain title, which should be only one world, second, a domain description of how to diagnose the 
failure jobs in the domain, such as how the job running in the domain, and how to use mcp tools to do checks. third, is the 
flow build in this page, it config properly each mcp tool with proper parameters, it can be store as a json to the backend. 

#### Create flow in the create domain page
There is a workspace to create a flow with proper mcp tool configs.
In the left panel, there are many boxes to be select from and drag to the center flow board, each box with different title, stands for different mcp tools. 
Initially, there is only one box in the center show the new domain name, user can click and config the domain title, and domain description info for job knowledge.
User can select one by one box and drag it to the center, after user release the drag to the center, it will automatically 
connect to the center box, and arrange properly in the view. then user can click this box and config this mcp tools with proper parameters. 

User can click save button, then frontend will check each boxes if all mandatory parameters configured with proper value. 
If not, highlight with proper promote info. If all info are correct, it will auto save to the backend. User can also click publish
button to publish this domain to public, then all people can select this domain in the main page. 


### Create new box for mcp tools
The last box in the left panel of the workspace is a box to create new mcp tool and demonstrate in the left panel. 
After user click the new box, it will direct to a page to create new mcp tool page. Also, in this page will list all 
tools created by the current user, and show status of each mcp tool. Weather it is published to public or waiting for 
the admin to review. If wait for admin review, it also may have review messages response from the admin, and shows in an additional column here. 
To create a new box, user need to input a proper title (show in the box, should be not very long), api url, and parameters for 
the api with proper type config. 
After user create this box, user can save the new mcp tool config. It will save to the backend. Also, user can test this tool 
in this page, to test this tool, user can set proper value for this tool, user can click and check the response. 
If there are errors when execute this in the backend, it will promote in the frontend with the error messages. If the mcp
tool execute success, it'll show the response in the UI. Also, the sample input of the mcp tool will be saved in the backend for admin review 
to try. 
After user test success, it can have a button to release this mcp tool. After user click release, this mcp tool will be 
showed in the mcp tool list with status "waiting_for_admin_review", and admin names for the user to contact if needed. 


#### Admin page
For admin, there have one additional page for production mcp tools and mcp tool need review. 
In the mcp tool review list, it shows the mcp tool name, creator name, parameter list, and button for test, comments and release. 
After user click test button, it will automatically fill with sample parameter value which origin tested by the mcp tool creator. If the mcp
tool execute success, it'll show the response in the UI. otherwise show the error message. If there are error message, 
admin can click the comments with proper messages from admin. After admin comments, user can see the comments in his mcp tool listing page. 
If no error happen, and response as expected, then admin can click release. After a mcp tool release, all user can see this mcp tool
in the workspace, and the owner create can see this mcp tool in his released mcp tool list. 



## Backend
In the backend, it's a python fastApi based, use mysql as the database. And provide proper api for the frontend. 
It uses poetry to do the package management, use dotenv to management different environment. black, isort, pytest also included for 
code format and testing. 

It provided API to register new users, create domain, create mcp tool, list mcp tool with released or non released status, 
review and updated mcp tool status for admin, execute mcp tool with proper parameters, diagnose one failure job with domain and job id. 
If one domain and job is already diagnosed, it will directly retrieve from database and show the analysis result. If it's a new job, 
it will trigger langgraph to diagnose the job failures with the domain knowledge for jobs, and help of mcp tools. 
