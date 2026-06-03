---
title: "Logging in Go (Logging in Go)"
description: "How to use Go's standard log package: the basic logger, writing to files, multiple outputs, and creating custom loggers."
date: 2021-01-02
update: 2021-01-02
tags:
  - go
  - golang
  - log
  - logging
  - logger
  - logrus
  - 고
  - 고랭
  - 로그
  - 로깅
---

# 1. Introduction

Among Go's standard packages, the log package provides the basic methods needed for logging. Besides standard output stdout and stderr, let's learn how to save logs to a file and how to change the log format for output.

You can use the log package right away by importing it without any additional installation.

```go
import "log"
```

# 2. How to Use the Log Package

## 2.1 The Basic Logger

The log package provides the Logger type to support multiple loggers.

```go
type Logger struct {
   mu     sync.Mutex // ensures atomic writes; protects the following fields
   prefix string     // prefix on each line to identify the logger (but see Lmsgprefix)
   flag   int        // properties
   out    io.Writer  // destination for output
   buf    []byte     // for accumulating text to write
}

...omitted...
var std = New(os.Stderr, "", LstdFlags) //<-- it's already created for you.
```

### 2.1.1 Printing Logs to the Screen with the Basic Logger

You can create a new Logger with the `log.New()` function. However, as shown below, you can use it right away without creating a separate logger. This is because the log package creates the std standard Logger in advance.

```go
func Test_Basic_Logger(t *testing.T) {
	log.Println("Logging") //2020/12/30 10:27:11 Logging

```

If you specify `log.SetFlags(0)`, only the message is printed without the date/time format.

```go
func Test_Basic_Logger_Flags_Setting_DateTime_Display_X(t *testing.T) {
	log.SetFlags(0)
	log.Println("Logging") //Logging
}
```
Let's change the log format by specifying multiple flag options. Use the or operator to specify multiple options together. The option below adds the prefix INFO and, besides the date/time, also prints the executable file.

```go
func Test_Basic_Logger_Flags_Setting2(t *testing.T) {
	log.SetFlags(log.Ldate | log.Ltime | log.Llongfile)
	log.SetPrefix("INFO: ")
	log.Println("Logging")

	//INFO: 2020/12/30 15:41:20 /Users/ykoh/GolandProjects/tutorials-go/go-logging/go_logging_test.go:23: Logging
}
```

For descriptions of the various flag options, please refer to the [Go Docs](https://golang.org/pkg/log/#pkg-examples).

```go
const (
   Ldate         = 1 << iota     // the date in the local time zone: 2009/01/23
   Ltime                         // the time in the local time zone: 01:23:23
   Lmicroseconds                 // microsecond resolution: 01:23:23.123123.  assumes Ltime.
   Llongfile                     // full file name and line number: /a/b/c/d.go:23
   Lshortfile                    // final file name element and line number: d.go:23. overrides Llongfile
   LUTC                          // if Ldate or Ltime is set, use UTC rather than the local time zone
   Lmsgprefix                    // move the "prefix" from the beginning of the line to before the message
   LstdFlags     = Ldate | Ltime // initial values for the standard logger
)
```

### 2.1.2 Writing to a File

To write logs to a file, first create the file to be saved with `os.OpenFile()` and specify the file pointer with the `log.SetOutput()` function; then when you use `log.Println()`, it gets written to the file.

```go
func Test_Basic_Logger_File(t *testing.T) {
	logFile, err := os.OpenFile("logfile.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		panic(err)
	}
	defer logFile.Close()

	log.SetOutput(logFile) //change the log output destination to a file

	printMsgLog("test msg")
	log.Println("End of Program")
}
```

### 2.1.3 Printing Logs to the Screen and a File at the Same Time

You can also configure logs to be output to a file and the screen at the same time. Create multiple writers by specifying the file pointer and os.Stdout with the `io.MultiWriter()` function, and specify it with `log.SetOutput()`, and logs will be written to multiple targets.

```go
func Test_Multiple_Outputs(t *testing.T) {
   logFile, err := os.OpenFile("logfile.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
   if err != nil {
      panic(err)
   }
   defer logFile.Close()

   multiWriter := io.MultiWriter(logFile, os.Stdout)
   log.SetOutput(multiWriter)

   printMsgLog("test msg")
   log.Println("End of Program")
}

func printMsgLog(msg string) {
   log.Print(msg)
}
```



## 2.2 Custom Logger

Let's create a Custom Logger with the `log.New()` function and print logs.

```go
func New(out io.Writer, prefix string, flag int) *Logger {
	return &Logger{out: out, prefix: prefix, flag: flag}
}
```

The `log.New()` function can create various loggers depending on its 3 argument values.

- 1st : specifies the log output
    - You can specify the standard console output (os.Stdout), standard error (os.Stderr), a file pointer, etc.
- 2nd : the log prefix
    - You can display the program name, category, etc.
- 3rd : the log format setting option

### 2.2.1 Creating a Custom Logger

The example below is code that creates a logger that sends logs to standard output and does logging. It creates and prints with a Logger that outputs the prefix "INFO: " and the date/time.

```go
var logger *log.Logger

func Test_Custom_Logger(t *testing.T) {
   logger = log.New(os.Stdout, "INFO: ", log.LstdFlags)
   logger.Println("Logging") //INFO: 2020/12/30 10:34:00 Logging
}
```

### 2.2.2 Writing to a Log File

As in 2.1.2, this is an example of creating a file Logger and writing logs to a file. It passes a file pointer as the first argument of `log.New()` to output to a file.

```go
func Test_Custom_Logger_File(t *testing.T) {
   // open the log file
   logFile, err := os.OpenFile("logfile.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
   if err != nil {
      panic(err)
   }
   defer logFile.Close()

   logger = log.New(logFile, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
   printMsgLogger("test msg")
   logger.Println("End of Program")
}

func printMsgLogger(msg string) {
	logger.Print(msg)
}

```



### 2.2.3 Example of Creating Multiple Loggers

The following example creates multiple Logger types and prints with them.

```go
type Logger struct {
   Trace *log.Logger
   Warn  *log.Logger
   Info  *log.Logger
   Error *log.Logger
}

var myLogger Logger

func logInit(traceHandle io.Writer, infoHandle io.Writer, warningHandle io.Writer, errorHandle io.Writer) {
   myLogger.Trace = log.New(traceHandle, "[TRACE] ", log.Ldate|log.Ltime|log.Lshortfile)
   myLogger.Info = log.New(infoHandle, "[INFO] ", log.Ldate|log.Ltime|log.Lshortfile)
   myLogger.Warn = log.New(warningHandle, "[WARNING] ", log.Ldate|log.Ltime|log.Lshortfile)
   myLogger.Error = log.New(errorHandle, "[ERROR] ", log.Ldate|log.Ltime|log.Lshortfile)
}

func Test(t *testing.T) {
   logInit(ioutil.Discard, os.Stdout, os.Stdout, os.Stderr)
   myLogger.Info.Println("Starting the application...")
   myLogger.Trace.Println("Something noteworthy happened")
   myLogger.Warn.Println("There is something you should know about")
   myLogger.Error.Println("Something went wrong")

   //[INFO] 2020/12/30 15:43:40 go_logging_test.go:46: Starting the application...
   //[WARNING] 2020/12/30 15:43:40 go_logging_test.go:48: There is something you should know about
   //[ERROR] 2020/12/30 15:43:40 go_logging_test.go:49: Something went wrong
}
```


# 4. Conclusion

In this post, we looked at how to do logging using the log package included by default in Go. Besides the Go standard package log, other log frameworks (e.g. logrus) are also often used. Let's learn about logrus in the next post.

The code written in this post can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-logging).

# 5. References

- http://golang.site/go/article/114-Logging
- https://www.ardanlabs.com/blog/2013/11/using-log-package-in-go.html
- https://jusths.tistory.com/128
- https://www.honeybadger.io/blog/golang-logging/
- https://golang.org/pkg/log/#pkg-examples
