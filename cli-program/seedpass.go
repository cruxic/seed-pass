package main

import (
	"fmt"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"bufio"
	"os"
	"log"
	//"hidapi"
	//"time"
	//"log"
	"flag"
)

type Seed struct {
	Bytes [32]byte
}

func readKeyboardNoise() string {
	bio := bufio.NewReader(os.Stdin)
	lines := ""
	nEmpty := 0
	for ; nEmpty < 2; {
		raw, _, err := bio.ReadLine()
		if err != nil {
			log.Fatal(err)			
		}
		
		line := string(raw)	
		
		//empty line means ENTER
		if len(strings.TrimSpace(line)) == 0 {
			nEmpty++
		} else {
			lines += line			
		}
	}
	
	return lines	
}

func doCreateSeed() {
	//here: adding too many features to CLI tool will bloat it.  Should browser do all the high-level operations like seed creation?
	//on the other hand it's good for testing when it can all be done from CLI.
	
	msg := `Seed creation should only be done on a computer which
	you are CONFIDENT is free from malware, spyware and viruses.  You
	will also need access to a printer.
	
	Please type some random characters on the keyboard now and then press
	ENTER three times.
	If you have a toddler around, ask them to pound on the keyboard for awhile.
	
	These random characters will be mixed with more random data from your
	operating system's secure random number generator to create your final
	random seed.
	
	Press ENTER three times when done:
	`
	
	fmt.Println(strings.TrimSpace(strings.Replace(msg, "\t", "" ,-1)))

	keyboardNoise := readKeyboardNoise()
	
	
	fmt.Println(keyboardNoise)
		
}

func main() {
	var help, createSeed bool
	
	flag.BoolVar(&help, "help", false, "Show help")
	flag.BoolVar(&createSeed, "create-seed", false, "Create a new random seed")
	
	flag.Parse()  //will exit here if invalid flags were given
	
	if help {
		flag.PrintDefaults()		
	}
	
	if createSeed {
		doCreateSeed()
		return
	}
	
	fmt.Println("done")
	
	
	
	mac := hmac.New(sha256.New, []byte("key\n"))
	mac.Write([]byte("message\n"))
	expectedMAC := mac.Sum(nil)
	fmt.Println(hex.EncodeToString(expectedMAC))
	
	/*
	hidapi.Init()
	
	hid, err := hidapi.Open(0x16C0, 0x0486)
	if err != nil {
		log.Fatal(err)
	}*/
	
	/*for {
		s, err := hid.Get_product_string()
		if err != nil {
			fmt.Println(err)
			break
		} else {
			fmt.Println(s)
		}
		
		time.Sleep(time.Second)
	}*/
	/*
	fmt.Println(hid.Get_manufacturer_string())
	fmt.Println(hid.Get_product_string())
	fmt.Println(hid.Get_serial_number_string)
	
	for i := 0; i < 3; i++ {

		fmt.Println("writing")
		packet := make([]byte, 64)
		for k := 0; k < 64; k++ {
			packet[k] = byte(k + 1)
		}
		err := hid.Write(packet)
		if err != nil {
			log.Fatal(err)
		}
	
		fmt.Println("reading")
		data, err := hid.Read_timeout(64, 10000)
		if data != nil {
			fmt.Println("read", len(data), "bytes", hex.EncodeToString(data))		
		} else if err != nil {
			log.Fatal(err)		
		} else {
			fmt.Println("read timed out")
		}
		
		time.Sleep(time.Second)
	}
	
	
	hid.Close()
	
	hidapi.Exit()*/
}
