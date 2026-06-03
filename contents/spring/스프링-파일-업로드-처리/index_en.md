---
title: "Handling File Uploads in Spring"
description: "How to implement single, multiple, and metadata-included file uploads in Spring."
date: 2019-01-02
update: 2019-01-02
tags:
  - web
  - spring
  - file
  - upload
  - springboot
  - 파일업로드
  - 스프링
---


# 1. Introduction

In this post, let's look at how to implement file uploads in Spring. Spring provides file upload functionality in several ways, not just single file uploads, as follows.

- Single file upload
- Multiple file upload
- File upload + additional information individually by @RequestParam
- File upload + additional information mapped to a class all at once by @ModelAttribute

Spring supports file uploads with the MultipartResolver interface and the following two implementations.

- Using Servlet 3.0 Multipart Request
    - Implementation : StandardServletMultipartResolver
    - You only need to configure it (XML, JavaConfig).
- Using the Apache Commons FileUpload API
    - Implementation : CommonsMultipartResolver
    - It is not limited to the Servlet 3 environment but works the same in a Servlet 3.x container as well \* You need to add the library to pom.xml

# 2. Development Environment

- OS : Mac OS
- IDE: Intellij
- Java : JDK 1.8
    - If you use JDK 9 or higher, there is an issue where javax_xml_bind/JAXBException cannot be found.
    - Solution : [https://github.com/ohnosequences/sbt-s3-resolver/issues/58](https://github.com/ohnosequences/sbt-s3-resolver/issues/58)
- Source code : [github](https://github.com/kenshin579/tutorials-java/tree/master/spring-mvc-xml-fileupload)
- Software management tool : Maven

# 3. Configuration for File Upload

Let's look at the basic configuration needed in Spring for file uploads. As mentioned, Spring can configure file uploads in two ways. In this post, let's explain mainly the first resolver, StandardServletMultipartResolver. You can also use the second resolver, CommonsMultipartResolver. If you have experience configuring Spring, I think you won't have much difficulty whichever you use. For the necessary content, please refer to the reference links.

- Servlet 3.0 Multipart Request (explained mainly with this method)
    - standardServletMultipartResolver
- Apache Commons FileUpload API
    - CommonsMultipartResolver

## 3.1 Spring and File Upload Limit Configuration

### 3.1.1 Configuration When Using StandardServletMultipartResolver

Bean XML definition file configuration
**1. Register the StandardServletMultipartResolver bean in Spring**

```xml
File : spring-mvc-xml-fileupload_src_main_webapp_WEB-INF/spring-mvc-config.xml
<bean id="multipartResolver" class="org.springframework.web.multipart.support.StandardServletMultipartResolver" />
```

**2. Declare multipart-config in the servlet configuration**

```xml
File : spring-mvc-xml-fileupload_src_main_webapp_WEB-INF/web.xml

<servlet>
    <servlet-name>hello-dispatcher</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>_WEB-INF_spring-mvc-config.xml</param-value>
    </init-param>
    <load-on-startup>1</load-on-startup>
    <multipart-config>
        <max-file-size>209715200</max-file-size>
        <max-request-size>209715200</max-request-size>
        <file-size-threshold>0</file-size-threshold>
    </multipart-config>
</servlet>
```

You can limit file uploads by configuring various options in Multipart-config.

- **location** - the absolute path where files are temporarily stored during upload
    - Default value : "
- **maxFileSize** - the maximum file size per file
    - Default value : no limit
- **maxRequestSize** - not the size of a single file, but the maximum file size per multipart/form-data request (think of it as the total size when uploading multiple files) \* Default value: no limit
- **fileSizeThreshold** - represents the size limit at which an uploaded file is passed directly as a stream from memory rather than being temporarily stored as a file
    - Default value: 0
    - ex. if you set 1024 \* 1024 = 1MB, the file is stored as a temporary file only when it is 1MB or larger

**JavaConfig Configuration**

**1. Register the StandardServletMultipartResolver bean in Spring**



```java
File : spring-mvc-javaconfig-fileupload-form/src/main/java/com/boraji/tutorial/spring/config/WebConfig.java
  
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = { "com.boraji.tutorial.spring.controller" })
public class WebConfig extends WebMvcConfigurerAdapter {
    …(omitted)...

    @Bean
    public MultipartResolver multipartResolver() {
        StandardServletMultipartResolver multipartResolver = new StandardServletMultipartResolver();
        return multipartResolver;
    }
}
```

**2. Register the Multipart-config settings** **as a MultipartConfigElement object**



```java
File : spring-mvc-javaconfig-fileupload-form/src/main/java/com/boraji/tutorial/spring/config/MyWebAppInitializer.java
  
public class MyWebAppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {
    private static int MAX_FILE_ZIZE = 10 * 1024 * 1024;
    …(omitted)...
    @Override
    protected void customizeRegistration(Dynamic registration) {
        MultipartConfigElement multipartConfig = new MultipartConfigElement("tmp_upload", MAX_FILE_ZIZE, MAX_FILE_ZIZE, 0);
        registration.setMultipartConfig(multipartConfig);
    }
}
```

**2.1 (Another method) Configuring file upload limits with the @MultipartConfig annotation**
You can create a custom servlet and configure multipart-config with the @MultipartConfig annotation. Let's not cover this configuration in detail. For additional explanation, please refer to the [@MultipartConfig❲Servlet 3.x❳ blog](http://blog.naver.com/PostView.nhn?blogId=junsu60&logNo=220439479589).

```java
@MultipartConfig(location=/tmp,
fileSizeThreshold=0,
maxFileSize=5242880, //5 MB
maxRequestSize=20971520) //20 MB
public class FileUploadServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    //handle file upload
}
```

### 3.1.2 Configuration When Using CommonsMultipartResolver

Unlike StandardServletMultipartResolver, when using the CommonsMultipartResolver resolver, you need to additionally add the commons-fileupload library to the pom.xml file.

**Adding the Dependency**

```xml
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.3.3</version>
</dependency>
```

The Spring configuration can be done with a Bean definition file or JavaConfig.

**Bean XML Definition File Configuration**

Register the CommonsMultipartResolver bean in the Spring configuration.

```xml
<bean id="multipartResolver" class="org.springframework.web.multipart.commons.CommonsMultipartResolver">
<property name="maxUploadSize" value="10485760"/>
<property name=“maxUploadSizePerFile" value="10485760”/>
<property name="maxInMemorySize" value=“0"/>
</bean>
```

**JavaConfig Configuration**



```java
File : spring-mvc-javaconfig-fileupload-ajax/src/main/java/com/boraji/tutorial/spring/config/WebConfig.java
  
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = { "com.boraji.tutorial.spring.controller" })
public class WebConfig extends WebMvcConfigurerAdapter {
    private final int MAX*SIZE = 10 * 1024 \- 1024;
    …(omitted)...
    @Bean
    public MultipartResolver multipartResolver() {
        CommonsMultipartResolver multipartResolver = new CommonsMultipartResolver();
        multipartResolver.setMaxUploadSize(MAX_SIZE); 10MB
        multipartResolver.setMaxUploadSizePerFile(MAX_SIZE); 10MB
        multipartResolver.setMaxInMemorySize(0);
        return multipartResolver;
    }
}
```

# 4. File Upload Examples

So far we have covered the Spring-related configuration. Now let's look at how to upload files in the view and controller layers. There are several ways to upload files. Let's also check the differences through examples.

## 4.1 Single File Upload

This is an example of uploading a single file. The view is written with the HTML input tag's file attribute so that you can upload a file via a form. The form tag's enctype attribute is set to multipart/form-data so that the browser operates in file upload mode.

**List of enctype attribute values**

| Value                                | Description                                               |
| --------------------------------- | -------------------------------------------------- |
| multipart/form-data               | Used for file uploads (no encoding)              |
| application_x-www-form_urlencoded | The default value, encodes all characters                    |
| text/plain                        | Spaces are converted to the + sign. Special characters are not encoded |

```html
<h3>Single File Upload</h3>
<form action="singleFileUpload" method="post" **enctype**="multipart/form-data">
  <table>
    <tr>
      <td>Select File</td>
      <td><input type="**file**" name="**mediaFile**" /></td>
      <td>
        <button type="submit">Upload</button>
      </td>
    </tr>
  </table>
</form>
```

**View screen in the browser**

![](/media/spring/스프링-파일-업로드-처리/image_8.png)

In the controller, the uploaded file is received using a MultipartFile variable. The MultipartFile class provides information about the file (file name, size, etc.) and file-related methods (e.g. saving the file). The representative methods used are as follows; for more details, please refer to the API.

- transferTo() : saves the file
- getOriginalFilename() : returns the file name as a String value
- getSize() : returns the file size
- getInputStream() : obtains the input stream for the file

```java
@PostMapping("/singleFileUpload")
public String singleFileUpload(@RequestParam("mediaFile") **MultipartFile** file, Model model)
throws IOException {

    // Save mediaFile on system
    if (!file.getOriginalFilename().isEmpty()) {
        file.transferTo (new File(DOWNLOAD_PATH + "/" + SINGLE_FILE_UPLOAD_PATH, file.getOriginalFilename()));
        model.addAttribute("msg", "File uploaded successfully.");
    } else {
        model.addAttribute("msg", "Please select a valid mediaFile..");
    }
    return "fileUploadForm";
}
```

Since the file name passed as a request parameter is passed as mediaFile, it is specified with the @RequestParam(“mediaFile”) annotation. And if the file is not empty, it is saved to the designated download path, and the result message is passed to the fileUploadForm view through the Model class.

> Bonus Tips
> When implementing a REST API, JSON is widely used as the data format exchanged between client and server. When exchanging in JSON type, it is encoded by default before sending. If the data being sent is small, it's not a problem, but in the case of large JSON, it greatly affects performance. In such cases, if you send the JSON data as a stream and receive it as a MultipartFile in the controller, performance improves a lot because it is simply received in stream form. It's a part worth considering when working on a project.

## 4.2 Multiple File Upload

The way to upload multiple files is very similar to the single file upload example. The difference is that you need to add the multiple attribute in the view so that the user can select multiple files.

```html
<h3>Multiple File Upload</h3>
<form action="multipleFileUpload" method="post" enctype="multipart/form-data">
  <table>
    <tr>
      <td>Select Files</td>
      <td><input type="file" name="mediaFile" **multiple="multiple" ** /></td>
      <td>
        <button type="submit">Upload</button>
      </td>
    </tr>
  </table>
</form>
```

**View screen in the browser**

![](/media/spring/스프링-파일-업로드-처리/image_1.png)

In the controller, the MultipartFile variable is declared as an array so that it can receive multiple files. Looping through the array, each file is saved to the designated path. You can save it with the transferTo method provided by the MultipartFile class, but you can also save the file directly with the OutputStream class.

```java
@PostMapping("/multipleFileUpload")
public String multipleFileUpload(@RequestParam("mediaFile") **MultipartFile[]** files,
Model model) throws IOException {

    Save mediaFile on system
    for (MultipartFile file : files) {
        if (!file.getOriginalFilename().isEmpty()) {
            BufferedOutputStream outputStream = new BufferedOutputStream(
            new FileOutputStream(
            new File(DOWNLOAD_PATH + "/" + MULTI_FILE_UPLOAD_PATH, file.getOriginalFilename())));

            outputStream.write(file.getBytes());
            outputStream.flush();
            outputStream.close();
        } else {
            model.addAttribute("msg", "Please select at least one mediaFile..");
            return "fileUploadForm";
        }
    }
    model.addAttribute("msg", "Multiple files uploaded successfully.");
    return "fileUploadForm";
}
```

## 4.3 File Upload + Additional Information by @RequestParam

This example sends a file together with other input information. Modify the form so that it can receive additional input.

```html
<h3>File Upload + Additional Information by @RequestParam</h3>
<form
  action="singleFileUploadWithAdditionalData"
  method="post"
  enctype="multipart/form-data"
>
  Creator:<br />
  <input type="text" **name="creator" ** />
  <br />
  CallbackUrl:<br />
  <input type="text" **name="callbackUrl”** >
  <br />
  <input type="file" **name="mediaFile" ** />
  <br /><br />
  <button type="submit">Upload</button>
</form>
```

**View screen in the browser**

![](/media/spring/스프링-파일-업로드-처리/image_7.png)

In the controller, the @RequestParam annotation is declared on each variable so that input data can be received individually.

```java
@PostMapping("/singleFileUploadWithAdditionalData")
public String singleFileUploadWith(@RequestParam("mediaFile") MultipartFile **file**,
@RequestParam final String **creator**, @RequestParam final String **callbackUrl**, Model model) throws IOException {

  log.info("creator : {}", creator);
  log.info("callbackUrl : {}", callbackUrl);

  // Save mediaFile on system
  if (!file.getOriginalFilename().isEmpty()) {
    file.transferTo(new File(DOWNLOAD_PATH + "/" + SINGLE_FILE_UPLOAD_AND_EXTRA_DATA1_PATH, file.getOriginalFilename()));
    model.addAttribute("msg", "File uploaded successfully.");
  } else {
    model.addAttribute("msg", "Please select a valid mediaFile..");
  }
  return "fileUploadForm";
}
```

## 4.4 File Upload + Additional Information by @ModelAttribute

In the 4.3 example, the input data was stored in individual variables. However, when there is a lot of input data, there is a disadvantage that the number of method arguments increases a lot. Using the @ModelAttribute annotation, you can map the input data to a class all at once.

For class mapping, create a class that includes variables with the same names as the data entered in the Form, as follows.

```java
@Data
public class MediaVO {
  private String creator;
  private String callbackUrl;
  private MultipartFile mediaFile;
}
```

Declare the class MediaVO, which will receive the user input data, as an argument.

```java
@RequestMapping(value = "/uploadFileModelAttribute", method = RequestMethod.POST)
public String singleFileUploadWith( **@ModelAttribute MediaVO mediaVO**, Model model) throws IOException {
  MultipartFile file = mediaVO.getMediaFile();

  log.info("mediaVO: {}", mediaVO);

  // Save mediaFile on system
  if (!file.getOriginalFilename().isEmpty()) {
    file.transferTo(new File(DOWNLOAD_PATH + "/" + SINGLE_FILE_UPLOAD_AND_EXTRA_DATA2_PATH, file.getOriginalFilename()));

  model.addAttribute("msg", "File uploaded successfully.");
  } else {
    model.addAttribute("msg", "Please select a valid mediaFile..");
  }
  return "fileUploadForm";
}
```

Since the uploaded file and input data are included in MediaVO, you fetch the desired data with getters and use it in the logic.

So far we have looked at file uploads using Spring. Next time, let's look at Spring controller exception handling.

# 5. References

- File Upload with Spring
    - [https://www.baeldung.com/spring-file-upload](https://www.baeldung.com/spring-file-upload)
    - [http://ktko.tistory.com/entry/Spring-단일파일-다중파일-업로드하기](http://ktko.tistory.com/entry/Spring-%EB%8B%A8%EC%9D%BC%ED%8C%8C%EC%9D%BC-%EB%8B%A4%EC%A4%91%ED%8C%8C%EC%9D%BC-%EC%97%85%EB%A1%9C%EB%93%9C%ED%95%98%EA%B8%B0)
    - [http://websystique.com/springmvc/spring-mvc-4-file-upload-example-using-commons-fileupload/](http://websystique.com/springmvc/spring-mvc-4-file-upload-example-using-commons-fileupload/)
    - [http://websystique.com/springmvc/spring-mvc-4-file-upload-example-using-multipartconfigelement/](http://websystique.com/springmvc/spring-mvc-4-file-upload-example-using-multipartconfigelement/)
    - [https://blog.hanumoka.net/2018/09/06/spring-20180906-spring-file-upload/](https://blog.hanumoka.net/2018/09/06/spring-20180906-spring-file-upload/)
    - [http://cornswrold.tistory.com/74](http://cornswrold.tistory.com/74)
- @Multipartconfig
    - [http://programmertech.com/program/jee/java-file-upload-using-servlet3-and-file-download](http://programmertech.com/program/jee/java-file-upload-using-servlet3-and-file-download)
    - [https://javaee.github.io/tutorial/servlets011.html#BABFGCHB](https://javaee.github.io/tutorial/servlets011.html#BABFGCHB)
    - [http://blog.naver.com/PostView.nhn?blogId=junsu60&logNo=220439479589](http://blog.naver.com/PostView.nhn?blogId=junsu60&logNo=220439479589)
      _ [https://www.ibm.com/developerworks/community/blogs/9e635b49-09e9-4c23-8999-a4d461aeace2/entry/160?lang=en](https://www.ibm.com/developerworks/community/blogs/9e635b49-09e9-4c23-8999-a4d461aeace2/entry/160?lang=en)
- File Upload Progress Bar
    - [https://www.boraji.com/spring-4-mvc-jquery-ajax-file-upload-example-with-progress-bar](https://www.boraji.com/spring-4-mvc-jquery-ajax-file-upload-example-with-progress-bar)
