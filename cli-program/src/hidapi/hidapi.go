package hidapi

/*
#cgo CFLAGS: -I/usr/local/include/hidapi
#cgo LDFLAGS: -L/usr/local/lib -lhidapi-libusb -lusb-1.0 -ludev
#include <stdio.h>
#include "hidapi.h"

static void wcharcpy(wchar_t * dest, const wchar_t * source, size_t maxLen) {
	size_t i;
	for (i = 0; i < maxLen && source[i] != 0; i++) {
		dest[i] = source[i];	
	}
	dest[i] = 0;
}

*/
import "C"
import (
	"unsafe"
	"errors"
	"fmt"
)

const wchar_buffer_size = 256

var gInitState int

type HID_Device struct {
	cptr unsafe.Pointer
}

//
// This must be called from a thread-safe context
//
func Init() error {
	if C.hid_init() != 0 {
		return errors.New("Failed to initialize HID library")
	} else {
		gInitState = 1
		return nil
	}
}

func Exit() {
	gInitState = 2
	C.hid_exit()	
}

func panicIfNotInit() {
	if gInitState == 0 {
		panic(errors.New("hidapi.Init() was not called"))
	} else if gInitState == 2 {
		panic(errors.New("hidapi.Exit() was already called!"))
	}
	//else OK
}

//HID_API_EXPORT hid_device * HID_API_CALL hid_open(unsigned short vendor_id, unsigned short product_id, const wchar_t *serial_number);
func Open(vendorId, productId int) (*HID_Device, error) {
	panicIfNotInit()
	
	ptr := C.hid_open(C.ushort(vendorId), C.ushort(productId), nil)
	if ptr != nil {
		return &HID_Device{
			cptr: unsafe.Pointer(ptr),
		}, nil
	} else {
		//TODO: check errno?
		return nil, errors.New(fmt.Sprintf("Unable to open HID device (vendor 0x%04X, product 0x%04X)", vendorId, productId))
	}	
}

func (self *HID_Device) Close() {
	if self.cptr != nil {
		C.hid_close(self.cptr)
		self.cptr = nil
	}
}

func (self *HID_Device) last_error() error {
	//const wchar_t* HID_API_CALL hid_error(hid_device *device);
	wcptr := C.hid_error(self.cptr)
	var str string
	if wcptr != nil {
		var wchars [wchar_buffer_size]C.wchar_t
		C.wcharcpy(&wchars[0], wcptr, C.size_t(wchar_buffer_size - 1))
		str = wchar2string(wchars)
	} else {
		//fallback to generic message
		str = "HID communication problem"
	}
	
	return errors.New(str)	
}

func (self *HID_Device) panic_ptr() {
	if self.cptr == nil {
		panic(errors.New("HID_Device already closed!"))
	}
}

func wchar2string(wchars [wchar_buffer_size]C.wchar_t) string {
	//find null term
	term := C.wchar_t(0)
	slen := 0
	for ; slen < wchar_buffer_size && wchars[slen] != term; slen++ {
		
	}
	
	//TODO: this only works for ASCII!  use a proper conversion function
	raw := make([]byte, slen)
	for i := 0; i < slen; i++ {
		raw[i] = byte(int(wchars[i]) & 0xFF)
	}
	
	return string(raw)
}

func (self *HID_Device) Get_manufacturer_string() (string, error) {
	var wchars [wchar_buffer_size]C.wchar_t
	
	self.panic_ptr()
	
	//int hid_get_manufacturer_string(hid_device *device, wchar_t *string, size_t maxlen);
	if C.hid_get_manufacturer_string(self.cptr, &wchars[0], C.size_t(wchar_buffer_size - 1)) == 0 {
		return wchar2string(wchars), nil		
	} else {
		return "", self.last_error()
	}
}

func (self *HID_Device) Get_product_string() (string, error) {
	var wchars [wchar_buffer_size]C.wchar_t
	
	self.panic_ptr()
	
	//int hid_get_product_string(hid_device *device, wchar_t *string, size_t maxlen);
	if C.hid_get_product_string(self.cptr, &wchars[0], C.size_t(wchar_buffer_size - 1)) == 0 {
		return wchar2string(wchars), nil	
	} else {
		return "", self.last_error()
	}
}

func (self *HID_Device) Get_serial_number_string() (string, error) {
	var wchars [wchar_buffer_size]C.wchar_t
	
	self.panic_ptr()
	
	//int hid_get_serial_number_string(hid_device *device, wchar_t *string, size_t maxlen);
	if C.hid_get_serial_number_string(self.cptr, &wchars[0], C.size_t(wchar_buffer_size - 1)) == 0 {
		return wchar2string(wchars), nil
	} else {
		return "", self.last_error()
	}
}

func (self *HID_Device) Read_timeout(numBytes, timeoutMillis int) ([]byte, error) {
//int HID_API_EXPORT HID_API_CALL hid_read_timeout(hid_device *dev, unsigned char *data, size_t length, int milliseconds);
	data := make([]byte, numBytes)
	res := C.hid_read_timeout(self.cptr, (*C.uchar)(unsafe.Pointer(&data[0])), C.size_t(numBytes), C.int(timeoutMillis))
	if res == 0 {
		//timeout
		return nil, nil
	} else if res > 0 {
		return data, nil		
	} else {
		return nil, self.last_error()		
	}
}





