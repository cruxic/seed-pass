package main

import (
	"fmt"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"hidapi"
	//"time"
	"log"
)

func main() {
	fmt.Println("hello")
	mac := hmac.New(sha256.New, []byte("key\n"))
	mac.Write([]byte("message\n"))
	expectedMAC := mac.Sum(nil)
	fmt.Println(hex.EncodeToString(expectedMAC))
	
	hidapi.Init()
	
	hid, err := hidapi.Open(0x16C0, 0x0486)
	if err != nil {
		log.Fatal(err)
	}
	
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
	
	fmt.Println(hid.Get_manufacturer_string())
	fmt.Println(hid.Get_product_string())
	fmt.Println(hid.Get_serial_number_string)
	
	fmt.Println("reading")
	data, err := hid.Read_timeout(10, 10000)
	if data != nil {
		fmt.Println("read", len(data), "bytes", hex.EncodeToString(data))		
	} else if err != nil {
		log.Fatal(err)		
	} else {
		fmt.Println("read timed out")
	}
	
	hid.Close()
	
	hidapi.Exit()
}
